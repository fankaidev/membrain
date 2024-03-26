import { SettingOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Radio } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatActions, ChatHistory, ChatInput } from "./components/chat";
import { ReferenceBox, addPageToReference } from "./components/references";
import { Settings } from "./components/settings";
import { useStorage } from "./hooks/useStorage";
import { callClaude } from "./utils/claude";
import {
  ChatAction,
  LLM_MODELS,
  Language,
  WA_MESSAGE_TYPE_NEW_TASK,
  WA_TASK_EXPLAIN_SELECTION,
  WA_TASK_SUMMARIZE_PAGE,
} from "./utils/config";
import { callGemini } from "./utils/gemini";
import { getLocaleMessage } from "./utils/locale";
import { Message, Reference } from "./utils/message";
import { callBaichuan, callKimi, callOpenAI, callYi } from "./utils/openai";
import { getCurrentSelection } from "./utils/page_content";

export const BlankDiv = ({ height }: { height?: number }) => {
  return <div style={{ height: `${height || 8}px`, margin: "0px", padding: "0px" }}></div>;
};

const Assistant = () => {
  const [lang, setLang] = useStorage<Language>(
    "sync",
    "language",
    chrome.i18n.getUILanguage() == "zh-CN" ? "zh" : "en"
  );
  const [apiKeys, setApiKeys] = useStorage<{ [key: string]: string }>("sync", "apiKeys", {});
  const [model, setModel] = useStorage<string>("local", "model", "");
  const [history, setHistory] = useStorage<Message[]>("local", "chatHistory", []);
  const [references, setReferences] = useStorage<Reference[]>("local", "references", []);
  const [processing, setProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [userInput, setUserInput] = useState("");
  const [task, setTask] = useState<string>();
  const [round, setRound] = useState(0);
  const [openDrawer, setOpenDrawer] = useState(false);
  const chatHistoryRef = useRef(null);

  const checkNewTask = async () => {
    const { task } = await chrome.storage.local.get("task");
    if (!task) {
      return;
    }
    console.debug("get new task, task=", task);
    const currentWindow = await chrome.windows.getCurrent();
    if (task.windowId === currentWindow.id) {
      await chrome.storage.local.set({ task: null });
      // wait for UseEffect to trigger, as `model` may not ready yet
      setTask(task.name);
    }
  };

  useEffect(() => {
    console.debug("init assistant");
    chrome.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type == WA_MESSAGE_TYPE_NEW_TASK) {
        console.log("on message");
        checkNewTask();
      }
    });
    // invoke explicitly, as newly opened panels may miss above message
    checkNewTask();
  }, []);

  useEffect(() => {
    if (!task) {
      return;
    }
    if (task === WA_TASK_SUMMARIZE_PAGE) {
      summarizePage();
    } else if (task === WA_TASK_EXPLAIN_SELECTION) {
      explainSelection();
    } else {
      console.error("unknown task:", task);
    }
    setTask("");
  }, [task]);

  useEffect(() => {
    if (!!apiKeys[model]) {
      return;
    }
    for (const key of LLM_MODELS) {
      if (apiKeys[key]) {
        console.debug("select first usable model", key);
        setModel(key);
        break;
      }
    }
  }, [apiKeys]);

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
  };

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
    if (chatHistoryRef.current) {
      const element = chatHistoryRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const chatWithLLM = async (content: string, context_references: Reference[] = references) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", model);
    setProcessing(true);
    setHistory([...history, query, reply]);
    setCurrentAnswer("");
    setRound((round) => round + 1);

    let systemPrompt = `${getLocaleMessage(lang, "prompt_system")}\n`;
    if (context_references.length > 0) {
      systemPrompt += `${getLocaleMessage(lang, "prompt_useRefences")}\n`;
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

  const summarize = async () => {
    if (references.length > 0) {
      chatWithLLM(getLocaleMessage(lang, "prompt_summarize"));
    }
  };

  const summarizePage = async () => {
    const pageRef = await addPageToReference(references, setReferences);
    if (pageRef) {
      chatWithLLM(`${getLocaleMessage(lang, "prompt_summarizePage")}: ${pageRef.title}`, [pageRef]);
    }
  };

  const explainSelection = async () => {
    const pageRef = await addPageToReference(references, setReferences);
    const selectionText = await getCurrentSelection();
    if (pageRef && selectionText) {
      const prompt = getLocaleMessage(lang, "prompt_summarizeSelection");
      chatWithLLM(`${prompt}:\n\n${selectionText}\n`, [pageRef]);
    }
  };

  const simpleChat = async () => {
    setUserInput("");
    chatWithLLM(userInput.trim());
  };

  const clearChats = () => {
    setHistory([]);
  };

  const selectModel = (e: any) => {
    setModel(e.target.value);
  };

  const chatActions = [
    new ChatAction("button_summarize", summarize),
    new ChatAction("button_summarizePage", summarizePage),
    new ChatAction("button_summarizeSelection", explainSelection),
  ];

  return (
    <>
      <Drawer title="Settings" onClose={() => setOpenDrawer(false)} open={openDrawer}>
        <Settings language={lang} setLanguage={setLang} apiKeys={apiKeys} setApiKeys={setApiKeys} />
      </Drawer>
      <Flex
        vertical
        justify="start"
        style={{
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <Button
          icon={<SettingOutlined />}
          type="text"
          size="middle"
          onClick={() => setOpenDrawer(true)}
        />

        <div id="references" style={{ padding: "8px 0px 8px 0px" }}>
          <ReferenceBox references={references} setReferences={setReferences} lang={lang} />
        </div>

        <div
          id="chats"
          ref={chatHistoryRef}
          style={{
            flex: "1 1",
            overflow: "auto",
            borderStyle: "solid none solid none",
            borderWidth: "1px",
            borderColor: "WhiteSmoke",
            padding: "8px 0px 8px 0px",
          }}
        >
          <ChatHistory history={history} />
          <ChatActions lang={lang} processing={processing} actions={chatActions} />
        </div>

        <div id="inputs" style={{ padding: "8px 4px 0px 4px" }}>
          <Radio.Group onChange={selectModel} value={model}>
            {LLM_MODELS.map((m: string) => (
              <Radio value={m} key={m} disabled={!apiKeys[m]}>
                {m}
              </Radio>
            ))}
          </Radio.Group>
          <ChatInput
            lang={lang}
            userInput={userInput}
            processing={processing}
            setUserInput={setUserInput}
            simpleChat={simpleChat}
            clearChats={clearChats}
          />
        </div>
        <BlankDiv height={8} />
      </Flex>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Assistant />
  </React.StrictMode>
);
