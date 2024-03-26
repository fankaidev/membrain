import {
  ClearOutlined,
  RobotOutlined,
  SendOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Tag, Tooltip } from "antd";
import markdownit from "markdown-it";
import React, { ChangeEvent, useEffect, useState } from "react";
import { ChatTask, Language } from "../utils/config";
import { getLocaleMessage } from "../utils/locale";
import { Message, Reference } from "../utils/message";
import { callBaichuan, callKimi, callOpenAI, callYi } from "../utils/openai";
import { callGemini } from "../utils/gemini";
import { callClaude } from "../utils/claude";
import { addPageToReference } from "./references";
import { getCurrentSelection } from "../utils/page_content";

export const ChatActions = ({
  lang,
  inChatTask,
  setChatTask,
}: {
  lang: Language;
  inChatTask: boolean;
  setChatTask: (task: ChatTask | null) => void;
}) => {
  const chatTasks: [string, ChatTask][] = [
    [
      getLocaleMessage(lang, "button_summarize"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarize"), "all"),
    ],
    [
      getLocaleMessage(lang, "button_summarizePage"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarizePage"), "page"),
    ],
    [
      getLocaleMessage(lang, "button_summarizeSelection"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarizeSelection"), "selection"),
    ],
  ];

  return (
    <>
      {inChatTask ? (
        <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: "8px" }}>
          processing
        </Tag>
      ) : (
        <Flex id="actions" wrap="wrap" gap="small">
          {chatTasks.map(([title, task], index) => (
            <Button size="small" type="dashed" onClick={() => setChatTask(task)} key={index}>
              {title}
            </Button>
          ))}
        </Flex>
      )}
    </>
  );
};

export const ChatSession = ({
  lang,
  model,
  apiKeys,
  references,
  chatTask,
  history,
  setReferences,
  setChatTask,
  setHistory,
}: {
  lang: Language;
  model: string;
  apiKeys: { [key: string]: string };
  references: Reference[];
  chatTask: ChatTask | null;
  history: Message[];
  setReferences: (value: Reference[]) => void;
  setChatTask: (task: ChatTask | null) => void;
  setHistory: (history: Message[]) => void;
}) => {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [round, setRound] = useState(0);
  const [processing, setProcessing] = useState(false);

  const md = markdownit();

  useEffect(() => {
    if (!currentAnswer) {
      return;
    }
    console.debug(`update history on answer change of round ${round}`);
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === "assistant") {
        setHistory([
          ...history.slice(0, -1),
          new Message(lastMsg.role, currentAnswer, lastMsg.model),
        ]);
      }
    }
  }, [currentAnswer, round]);

  const onResponseContent = (content: string) => {
    console.debug("on response content");
    setCurrentAnswer((answer) => answer + content);
  };

  const onResponseFinish = (errorMsg: string = "") => {
    console.log("on response finish, errorMsg=", errorMsg);
    if (errorMsg) {
      setCurrentAnswer((answer) => answer + ` [ERROR]:${errorMsg}`);
    }
    setProcessing(false);
    setChatTask(null);
  };

  const chatWithLLM = async (content: string, context_references: Reference[]) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", model);
    setProcessing(true);
    setHistory([...history, query, reply]);
    setCurrentAnswer("");
    setRound((round) => round + 1);

    let systemPrompt = `${getLocaleMessage(lang, "prompt_system")}\n`;
    if (context_references.length > 0) {
      systemPrompt += `${getLocaleMessage(lang, "prompt_useReferences")}\n`;
      for (const [index, ref] of context_references.entries()) {
        systemPrompt += `${index + 1}: type=${ref.type}`;
        if (ref.type === "webpage") {
          systemPrompt += `, url=${ref.url}, title=${ref.title}`;
        }
        systemPrompt += `\n===\n${ref.content}\n===\n`;
      }
    }
    const systemMsg = new Message("system", systemPrompt);
    const messages = [systemMsg, ...history, query];
    const apiKey = apiKeys[model];
    if (model === "Kimi") {
      callKimi(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Yi") {
      callYi(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Gemini") {
      callGemini(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Claude") {
      callClaude(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Baichuan") {
      callBaichuan(apiKey, messages, onResponseContent, onResponseFinish);
    } else {
      callOpenAI(apiKey, messages, onResponseContent, onResponseFinish);
    }
  };

  // handle chat task change
  useEffect(() => {
    if (!chatTask) {
      return;
    }
    if (!chatTask.prompt || processing) {
      console.error("invalid chat task=", chatTask, "processing=", processing);
      return;
    }
    if (chatTask.reference_type === "page") {
      addPageToReference(references, setReferences).then((pageRef) => {
        if (pageRef) {
          const prompt = `${getLocaleMessage(lang, "prompt_pageReference")}\n\n\`\`\`${
            pageRef.title
          }\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, [pageRef]);
        }
      });
    } else if (chatTask.reference_type === "selection") {
      getCurrentSelection().then((selection) => {
        if (selection) {
          const prompt = `${getLocaleMessage(
            lang,
            "prompt_selectionReference"
          )}\n\n\`\`\`${selection}\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, references);
        }
      });
      chatWithLLM(chatTask.prompt, references);
    } else {
      chatWithLLM(chatTask.prompt, references);
    }
  }, [chatTask]);

  return (
    <>
      {history.map((item, index) => {
        const html = md.render(item.content);
        return (
          <div key={"history" + index}>
            <span>
              {item.model ? <RobotOutlined /> : <UserOutlined />}
              <em>
                <b>{item.model ? ` ${item.role}(${item.model})` : ` ${item.role}`}</b>
              </em>
            </span>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </>
  );
};

export const ChatInput = ({
  lang,
  inChatTask,
  setChatTask,
  clearChatSession,
}: {
  lang: Language;
  inChatTask: boolean;
  setChatTask: (task: ChatTask | null) => void;
  clearChatSession: () => void;
}) => {
  const [userInput, setUserInput] = useState("");

  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const chat = () => {
    if (inChatTask || !userInput.trim()) {
      return;
    }
    setChatTask(new ChatTask(userInput.trim(), "all"));
    setUserInput("");
  };

  const handleUserInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      chat();
    }
  };

  return (
    <>
      <Flex dir="row" gap={4}>
        <Input.TextArea
          value={userInput}
          placeholder={getLocaleMessage(lang, "input_placeholder")}
          onChange={handleUserInputChange}
          onKeyDown={handleUserInputKeyDown}
          autoSize
          allowClear
        />

        <Tooltip title={getLocaleMessage(lang, "tooltip_sendMessage")}>
          <Button icon={<SendOutlined />} type="text" size="middle" onClick={chat} />
        </Tooltip>
        <Tooltip title={getLocaleMessage(lang, "tooltip_clearChats")}>
          <Button
            icon={<ClearOutlined />}
            type="text"
            size="middle"
            danger
            onClick={clearChatSession}
          />
        </Tooltip>
      </Flex>
    </>
  );
};
