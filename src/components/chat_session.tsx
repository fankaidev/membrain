import {
  DownCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  UpCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Col, Row } from "antd";
import markdownit from "markdown-it";
import React, { useEffect, useState } from "react";
import { callClaude } from "../utils/anthropic_api";
import { Model, ModelProvider, ProviderConfig } from "../utils/config";
import { callGemini } from "../utils/google_api";
import { CHAT_STATUS_PROCESSING, ChatTask, Message, Reference } from "../utils/message";
import { callOpenAIApi } from "../utils/openai_api";
import { getCurrentSelection } from "../utils/page_content";
import { BlankDiv } from "./common";
import { addPageToReference } from "./references";

export const ChatSession = ({
  displayText,
  chatLanguage,
  modelName,
  enabledModels,
  providerConfigs,
  references,
  chatTask,
  history,
  chatStatus,
  setReferences,
  setChatTask,
  setHistory,
  setChatStatus,
}: {
  displayText: (text: string) => string;
  chatLanguage: string;
  modelName: string;
  enabledModels: [Model, ModelProvider][];
  providerConfigs: Record<string, ProviderConfig>;
  references: Reference[];
  chatTask: ChatTask | null;
  history: Message[];
  chatStatus: string;
  setReferences: (value: Reference[]) => void;
  setChatTask: (task: ChatTask | null) => void;
  setHistory: (history: Message[]) => void;
  setChatStatus: (status: string) => void;
}) => {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [round, setRound] = useState(0);
  const [collpasedIndexes, setCollapsedIndexes] = useState<Set<number>>(new Set());

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

  useEffect(() => {
    if (history.length === 0) {
      setCollapsedIndexes(new Set());
    }
  }, [history]);

  const onResponseContent = (content: string) => {
    console.debug("on response content");
    setCurrentAnswer((answer) => answer + content);
  };

  const onResponseFinish = (errorMsg: string = "") => {
    console.log("on response finish, errorMsg=", errorMsg);
    if (errorMsg) {
      setCurrentAnswer((answer) => answer + ` [ERROR]:${errorMsg}`);
    }
    setChatStatus("");
  };

  const initMessages = (content: string, context_references: Reference[]) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", modelName);
    let systemPrompt = `You are a smart assistant, please try to answer user's questions as accurately as possible.
    You should use following language to communicate with user: \`${chatLanguage}\` \n`;
    if (context_references.length > 0) {
      systemPrompt += `${displayText("prompt_useReferences")}\n`;
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
    setHistory([...history, query, reply]);
    return messages;
  };

  const chatWithAI = async (messages: Message[]) => {
    const modelAndProvider = enabledModels.find((m) => m[0].name === modelName);
    if (!modelAndProvider) {
      setChatStatus(`model ${modelName} not found`);
      return;
    }
    const [model, provider] = modelAndProvider;
    const apiKey = providerConfigs[provider.id]?.apiKey;
    if (!apiKey) {
      setChatStatus(`api key of ${provider.name}:${modelName} not found`);
      return;
    }

    setCurrentAnswer("");
    setRound((round) => round + 1);
    setChatStatus(CHAT_STATUS_PROCESSING);

    if (provider.apiType === "Google") {
      callGemini(apiKey, model, messages, onResponseContent, onResponseFinish);
    } else if (provider.apiType === "Anthropic") {
      callClaude(apiKey, model, messages, onResponseContent, onResponseFinish);
    } else {
      callOpenAIApi(provider, apiKey, model, messages, onResponseContent, onResponseFinish);
    }
  };

  const startChat = async (content: string, context_references: Reference[]) => {
    const messages = initMessages(content, context_references);
    chatWithAI(messages);
  };

  // handle chat task change
  useEffect(() => {
    if (!chatTask) {
      return;
    }
    setChatTask(null); // don't affect current value of chatTask
    if (chatStatus === CHAT_STATUS_PROCESSING) {
      return;
    }
    if (!chatTask.prompt) {
      setChatStatus("empty prompt");
      return;
    }
    console.log("chat task=", chatTask);
    if (chatTask.reference_type === "page") {
      addPageToReference(references, setReferences).then((pageRef) => {
        if (pageRef) {
          const prompt = `${displayText("prompt_pageReference")}\n\n\`\`\`${
            pageRef.title
          }\`\`\`\n\n${chatTask.prompt}`;
          startChat(prompt, [pageRef]);
        } else {
          setChatStatus("fail to get content of current page");
        }
      });
    } else if (chatTask.reference_type === "selection") {
      getCurrentSelection().then((selection) => {
        if (selection) {
          console.log("selection is", selection);
          const prompt = `${displayText("prompt_selectionReference")}\n\n
          \`\`\`${selection}\`\`\`\n\n${chatTask.prompt}`;
          startChat(prompt, references);
        } else {
          setChatStatus("fail to get selection of current page");
        }
      });
    } else {
      startChat(chatTask.prompt, references);
    }
  }, [chatTask]);

  const toggleDisplay = (index: number) => {
    const newSet = new Set(collpasedIndexes);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCollapsedIndexes(newSet);
  };

  const redoChat = (index: number) => {
    if (chatStatus !== CHAT_STATUS_PROCESSING) {
      const reply = new Message("assistant", "", modelName);
      const messages = [...history.slice(0, index + 1), reply];
      setHistory(messages);
      setCollapsedIndexes(new Set([...collpasedIndexes].filter((i) => i <= index)));
      chatWithAI(messages);
    }
  };

  return (
    <>
      {history.map((item, index) => {
        const html = md.render(item.content);
        return (
          <div key={"history" + index} style={{ margin: "2px" }}>
            <Row align={"middle"}>
              <Col span={20}>
                {item.model ? (
                  <RobotOutlined style={{ color: "MediumSeaGreen" }} />
                ) : (
                  <UserOutlined style={{ color: "Orange" }} />
                )}
                <b>{item.model ? ` ${item.model}` : ` ${item.role}`}</b>
              </Col>
              <Col span={2}>
                {item.role === "user" && chatStatus !== CHAT_STATUS_PROCESSING && (
                  <Button icon={<ReloadOutlined />} type="text" onClick={() => redoChat(index)} />
                )}
              </Col>
              <Col span={2}>
                <Button
                  icon={collpasedIndexes.has(index) ? <DownCircleOutlined /> : <UpCircleOutlined />}
                  onClick={() => toggleDisplay(index)}
                  type="text"
                />
              </Col>
            </Row>
            {collpasedIndexes.has(index) ? (
              <BlankDiv />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>
        );
      })}
    </>
  );
};
