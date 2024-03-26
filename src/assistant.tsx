import { SettingOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Radio } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatActions, ChatInput, ChatSession } from "./components/chat";
import { ReferenceBox, addPageToReference } from "./components/references";
import { Settings } from "./components/settings";
import { useStorage } from "./hooks/useStorage";
import {
  ChatTask,
  LLM_MODELS,
  Language,
  WA_MENU_TASK_EXPLAIN_SELECTION,
  WA_MENU_TASK_SUMMARIZE_PAGE,
  WA_MESSAGE_TYPE_MENU_TASK,
} from "./utils/config";
import { getLocaleMessage } from "./utils/locale";
import { Message, Reference } from "./utils/message";

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
  const [chatTask, setChatTask] = useState<ChatTask | null>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const chatHistoryRef = useRef(null);

  // handle tasks from menu
  const checkNewTaskFromBackground = async () => {
    const { menuTask } = await chrome.storage.local.get("menuTask");
    if (!menuTask) {
      return;
    }
    const currentWindow = await chrome.windows.getCurrent();
    console.debug("get menu task=", menuTask, "current window=", currentWindow.id);
    if (menuTask.windowId !== currentWindow.id) {
      return;
    }
    chrome.storage.local.set({ menuTask: null });
    const pageRef = await addPageToReference(references, setReferences);
    if (!pageRef) {
      console.error("fail to get current page");
    } else if (menuTask.name === WA_MENU_TASK_SUMMARIZE_PAGE) {
      setChatTask(new ChatTask(getLocaleMessage(lang, "prompt_summarizePage"), "page"));
    } else if (menuTask.name === WA_MENU_TASK_EXPLAIN_SELECTION) {
      setChatTask(new ChatTask(getLocaleMessage(lang, "prompt_summarizeSelection"), "selection"));
    } else {
      console.error("unknown menu task:", menuTask);
    }
  };

  useEffect(() => {
    console.debug("init assistant");
    chrome.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type == WA_MESSAGE_TYPE_MENU_TASK) {
        console.log("receive menu task message", message);
        checkNewTaskFromBackground();
      }
    });
    // invoke explicitly, as newly opened panels may miss above message
    checkNewTaskFromBackground();
  }, []);

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

  useEffect(() => {
    if (chatHistoryRef.current) {
      const element = chatHistoryRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const clearChatSession = () => {
    setHistory([]);
  };

  const selectModel = (e: any) => {
    setModel(e.target.value);
  };

  return (
    <>
      <Drawer title="Settings" onClose={() => setOpenSettings(false)} open={openSettings}>
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
          onClick={() => setOpenSettings(true)}
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
          <ChatSession
            lang={lang}
            model={model}
            apiKeys={apiKeys}
            references={references}
            chatTask={chatTask}
            history={history}
            setReferences={setReferences}
            setChatTask={setChatTask}
            setHistory={setHistory}
          />
          <ChatActions lang={lang} inChatTask={chatTask !== null} setChatTask={setChatTask} />
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
            inChatTask={chatTask !== null}
            setChatTask={setChatTask}
            clearChatSession={clearChatSession}
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
