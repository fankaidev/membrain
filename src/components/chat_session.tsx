import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import markdownit from "markdown-it";
import React, { useEffect, useState } from "react";
import { callClaude } from "../utils/claude";
import { Language } from "../utils/config";
import { callGemini } from "../utils/gemini";
import { getLocaleMessage } from "../utils/locale";
import { ChatTask, Message, Reference } from "../utils/message";
import { callBaichuan, callKimi, callOpenAI, callYi } from "../utils/openai";
import { getCurrentSelection } from "../utils/page_content";
import { addPageToReference } from "./references";

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
    console.log("chat task=", chatTask);
    if (chatTask.reference_type === "page") {
      console.debug("add page reference");
      addPageToReference(references, setReferences).then((pageRef) => {
        if (pageRef) {
          const prompt = `${getLocaleMessage(lang, "prompt_pageReference")}\n\n\`\`\`${
            pageRef.title
          }\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, [pageRef]);
        } else {
          setChatTask(null);
        }
      });
    } else if (chatTask.reference_type === "selection") {
      console.debug("add selection reference");
      getCurrentSelection().then((selection) => {
        if (selection) {
          console.log("selection is", selection);
          const prompt = `${getLocaleMessage(
            lang,
            "prompt_selectionReference"
          )}\n\n\`\`\`${selection}\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, references);
        } else {
          setChatTask(null);
        }
      });
    } else {
      console.log("chat task=", chatTask.reference_type);

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
