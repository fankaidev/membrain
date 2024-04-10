import {
  DownCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  UpCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Col, Row } from "antd";
import markdownit from "markdown-it";
import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "../logic/app_state";
import { useChatState } from "../logic/chat_state";
import { useReferenceState } from "../logic/reference_state";
import { callClaude } from "../utils/anthropic_api";
import { callGemini } from "../utils/google_api";
import { TXT } from "../utils/locale";
import {
  CHAT_STATUS_EMPTY,
  CHAT_STATUS_PROCESSING,
  ChatTask,
  Message,
  Reference,
} from "../utils/message";
import { callOpenAIApi } from "../utils/openai_api";
import { getCurrentSelection } from "../utils/page_content";
import { BlankDiv } from "./common";

export const ChatSession = () => {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [collpasedIndexes, setCollapsedIndexes] = useState<Set<number>>(new Set());
  const { chatTask, setChatTask, chatStatus, setChatStatus, providerConfigs } = useChatState();
  const chatTaskRef = useRef(chatTask);
  const { references, addPageRef } = useReferenceState();
  const { chatLanguage, displayText } = useAppState();
  const { temperature, getCurrentModel, history, setHistory } = useChatState();
  const md = markdownit();
  const currentModel = getCurrentModel();

  useEffect(() => {
    if (!currentAnswer) {
      return;
    }
    console.debug(`update history on answer change for task ${chatTask?.id}`);
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === "assistant") {
        setHistory([
          ...history.slice(0, -1),
          new Message(lastMsg.role, currentAnswer, lastMsg.model, temperature),
        ]);
      }
    }
  }, [currentAnswer]);

  useEffect(() => {
    if (history.length === 0) {
      setCollapsedIndexes(new Set());
    }
  }, [history]);

  const onResponseContent = (chatId: string, content: string) => {
    if (chatId === chatTaskRef.current?.id) {
      console.debug(`on response content, chatId=${chatId}`);
      setCurrentAnswer((answer) => answer + content);
    } else {
      console.debug(`on response content, chatId=${chatId}, but current chatId=${chatTask?.id}`);
    }
  };

  const onResponseFinish = (chatId: string, errorMsg: string = "") => {
    if (chatId === chatTaskRef.current?.id) {
      console.log(`on response finish, chatId=${chatId}, errorMsg=${errorMsg}`);
      if (errorMsg) {
        setCurrentAnswer((answer) => answer + ` [ERROR]:${errorMsg}`);
      }
      finishChatTask(CHAT_STATUS_EMPTY);
    } else {
      console.log(`on response finish, chatId=${chatId}, but current chatId=${chatTask?.id}`);
    }
  };

  const getSystemMessage = (context_references: Reference[]) => {
    let systemPrompt = `You are a smart assistant, please try to answer user's questions as accurately as possible.
    You should use following language to communicate with user: \`${chatLanguage}\` \n`;
    if (context_references.length > 0) {
      systemPrompt += `${displayText(TXT.PROMPT_USE_REF)}\n`;
      for (const [index, ref] of context_references.entries()) {
        systemPrompt += `${index + 1}: type=${ref.type}`;
        if (ref.type === "webpage") {
          systemPrompt += `, url=${ref.url}, title=${ref.title}`;
        }
        systemPrompt += `\n===\n${ref.content}\n===\n`;
      }
    }
    return new Message("system", systemPrompt);
  };

  const initMessages = (content: string, context_references: Reference[]) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", currentModel?.model.name, temperature);
    const systemMsg = getSystemMessage(context_references);
    const messages = [systemMsg, ...history, query];
    setHistory([...history, query, reply]);
    return messages;
  };

  const finishChatTask = (status: string) => {
    setChatStatus(status);
    setChatTask(null);
  };

  const chatWithAI = async (messages: Message[]) => {
    if (!currentModel) {
      finishChatTask("model not available");
      return;
    }
    const { model, provider } = currentModel;
    const apiKey = providerConfigs[provider.id]?.apiKey;
    if (!apiKey) {
      finishChatTask(`api key of ${provider.name}:${model.name} not found`);
      return;
    }

    setCurrentAnswer("");

    if (provider.apiType === "Google") {
      callGemini(
        apiKey,
        model,
        temperature,
        messages,
        chatTask!.id,
        onResponseContent,
        onResponseFinish,
      );
    } else if (provider.apiType === "Anthropic") {
      callClaude(
        apiKey,
        model,
        temperature,
        messages,
        chatTask!.id,
        onResponseContent,
        onResponseFinish,
      );
    } else {
      callOpenAIApi(
        provider,
        apiKey,
        model,
        temperature,
        messages,
        chatTask!.id,
        onResponseContent,
        onResponseFinish,
      );
    }
  };

  const startChat = async (content: string, context_references: Reference[]) => {
    const messages = initMessages(content, context_references);
    chatWithAI(messages);
  };

  // handle chat task change
  useEffect(() => {
    console.log("chat task=", chatTask);
    chatTaskRef.current = chatTask;
    if (!chatTask) {
      if (chatStatus === CHAT_STATUS_PROCESSING) {
        console.log("reset chat status on empty task");
        setChatStatus(CHAT_STATUS_EMPTY);
      }
      return;
    }
    if (!chatTask.prompt) {
      finishChatTask("empty prompt");
      return;
    }

    setChatStatus(CHAT_STATUS_PROCESSING);
    if (chatTask.reference_type === "page") {
      addPageRef().then((pageRef) => {
        if (pageRef) {
          const prompt = `${displayText(TXT.PROMPT_PAGE_REF)}\n\n\`\`\`${pageRef.title}\`\`\`\n\n${
            chatTask.prompt
          }`;
          startChat(prompt, [pageRef]);
        } else {
          finishChatTask("fail to get content of current page");
        }
      });
    } else if (chatTask.reference_type === "selection") {
      getCurrentSelection().then((selection) => {
        if (selection) {
          console.log("selection is", selection);
          const prompt = `${displayText(TXT.PROMPT_SELECTION_REF)}\n\n
          \`\`\`${selection}\`\`\`\n\n${chatTask.prompt}`;
          startChat(prompt, references);
        } else {
          finishChatTask("fail to get selection of current page");
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
    // FIXME: should save references for each message ?
    if (chatStatus !== CHAT_STATUS_PROCESSING && currentModel) {
      const content = history[index].content;
      setHistory(history.slice(0, index));
      setCollapsedIndexes(new Set([...collpasedIndexes].filter((i) => i < index)));
      setChatTask(new ChatTask(content, "all"));
    }
  };

  return (
    <>
      {history.map((item, index) => {
        const html = md.render(item.content);
        return (
          <div key={"history" + index} style={{ marginLeft: "2px", marginRight: "2px" }}>
            <Row align={"middle"} style={{ backgroundColor: "WhiteSmoke" }}>
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
            <BlankDiv height={4} />
            {!collpasedIndexes.has(index) && html ? (
              <div
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                  marginTop: "-12px",
                }}
              />
            ) : (
              <BlankDiv height={4} />
            )}
          </div>
        );
      })}
    </>
  );
};
