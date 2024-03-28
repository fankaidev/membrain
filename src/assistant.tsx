import {
  ApiOutlined,
  DeploymentUnitOutlined,
  FormOutlined,
  PoweroffOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Flex, Row, Select, Tooltip } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatActions } from "./components/chat_actions";
import { ChatInput } from "./components/chat_input";
import { ChatSession } from "./components/chat_session";
import { BlankDiv } from "./components/common";
import { ModelSettings } from "./components/model_settings";
import { PromptSettings } from "./components/prompt_settings";
import { ReferenceBox, addPageToReference } from "./components/references";
import { Settings } from "./components/settings";
import { useStorage } from "./hooks/useStorage";
import {
  Language,
  Model,
  ModelProvider,
  ProviderConfig,
  SYSTEM_MODELS,
  SYSTEM_PROVIDERS,
  WA_MENU_TASK_EXPLAIN_SELECTION,
  WA_MENU_TASK_SUMMARIZE_PAGE,
  WA_MESSAGE_TYPE_MENU_TASK,
} from "./utils/config";
import { getLocaleMessage } from "./utils/locale";
import { ChatTask, Message, PromptTemplate, Reference } from "./utils/message";

const Assistant = () => {
  const [lang, setLang] = useStorage<Language>("sync", "language", "en");
  const [modelName, setModelName] = useStorage<string>("local", "modelName", "");
  const [history, setHistory] = useStorage<Message[]>("local", "chatHistory", []);
  const [references, setReferences] = useStorage<Reference[]>("local", "references", []);
  const [chatTask, setChatTask] = useState<ChatTask | null>(null);
  const [chatStatus, setChatStatus] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const [openPromptSettings, setOpenPromptSettings] = useState(false);
  const [openModelSettings, setOpenModelSettings] = useState(false);
  const [promptTemplates, setPromptTemplates] = useStorage<PromptTemplate[]>(
    "sync",
    "promptTemplates",
    []
  );
  const [providerConfigs, setProviderConfigs] = useStorage<Record<string, ProviderConfig>>(
    "sync",
    "providerConfigs",
    {}
  );
  const [customModels, setCustomModels] = useStorage<Model[]>("sync", "customModels", []);
  const [customProviders, setCustomProviders] = useStorage<ModelProvider[]>(
    "sync",
    "customModels",
    []
  );

  const chatHistoryRef = useRef(null);
  const allModels = [...SYSTEM_MODELS, ...customModels];
  const allProviders = [...SYSTEM_PROVIDERS, ...customProviders];

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
    if (chatHistoryRef.current) {
      const element = chatHistoryRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const clearChatSession = () => {
    setHistory([]);
    setChatStatus("");
    setChatTask(null);
  };

  const clearAll = () => {
    clearChatSession();
    setReferences([]);
  };

  const selectModel = (modelName: string) => {
    setModelName(modelName);
  };

  const enabledModels = Object.values(providerConfigs)
    .filter((c) => c.enabled)
    .flatMap((c) =>
      allModels.filter((m) => m.providerId === c.providerId && c.enabledModels.includes(m.name))
    );

  useEffect(() => {
    if (!enabledModels.map((m) => m.name).includes(modelName)) {
      if (enabledModels.length > 0) {
        setModelName(enabledModels[0].name);
      } else {
        setModelName("");
      }
    }
  }, [providerConfigs]);

  return (
    <>
      <Drawer
        title="General Settings"
        onClose={() => setOpenSettings(false)}
        open={openSettings}
        keyboard={false}
      >
        <Settings language={lang} setLanguage={setLang} />
      </Drawer>
      <Drawer
        title="Prompt Settings"
        onClose={() => setOpenPromptSettings(false)}
        open={openPromptSettings}
        keyboard={false}
      >
        <PromptSettings promptTemplates={promptTemplates} setPromptTemplates={setPromptTemplates} />
      </Drawer>
      <Drawer
        title="Model Settings"
        onClose={() => setOpenModelSettings(false)}
        open={openModelSettings}
        keyboard={false}
      >
        <ModelSettings
          language={lang}
          providerConfigs={providerConfigs}
          setProviderConfigs={setProviderConfigs}
          customModels={customModels}
          setCustomModels={setCustomModels}
          customProviders={customProviders}
          setCustomProviders={setCustomProviders}
        />
      </Drawer>
      <Flex
        vertical
        justify="start"
        style={{
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <Row>
          <Tooltip title="clear all">
            <Button
              icon={<PoweroffOutlined />}
              type="text"
              size="middle"
              danger
              onClick={clearAll}
            />
          </Tooltip>
          <Tooltip title="general settings">
            <Button
              icon={<SettingOutlined />}
              type="text"
              size="middle"
              onClick={() => setOpenSettings(true)}
            />{" "}
          </Tooltip>
          <Tooltip title="prompt settings">
            <Button
              icon={<FormOutlined />}
              type="text"
              size="middle"
              onClick={() => setOpenPromptSettings(true)}
            />{" "}
          </Tooltip>
          <Tooltip title="model settings">
            <Button
              icon={<DeploymentUnitOutlined />}
              type="text"
              size="middle"
              onClick={() => setOpenModelSettings(true)}
            />{" "}
          </Tooltip>
        </Row>

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
            modelName={modelName}
            providerConfigs={providerConfigs}
            references={references}
            chatTask={chatTask}
            history={history}
            chatStatus={chatStatus}
            setReferences={setReferences}
            setChatTask={setChatTask}
            setHistory={setHistory}
            setChatStatus={setChatStatus}
            allModels={enabledModels}
            allProviders={allProviders}
          />
          <ChatActions
            lang={lang}
            promptTemplates={promptTemplates}
            setChatTask={setChatTask}
            chatStatus={chatStatus}
          />
        </div>

        <div id="inputs" style={{ padding: "8px 4px 0px 4px" }}>
          <Select
            onChange={selectModel}
            value={modelName}
            style={{ width: "100%" }}
            placeholder="Select Model"
            options={enabledModels.map((m: Model) => ({ value: m.name }))}
            showSearch
          />
          <BlankDiv height={4} />
          <ChatInput
            lang={lang}
            inChatTask={chatTask !== null}
            setChatTask={setChatTask}
            clearChatSession={clearChatSession}
          />
          <BlankDiv height={8} />
        </div>
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
