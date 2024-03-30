import {
  ClearOutlined,
  DeploymentUnitOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Col, Drawer, Flex, Row, Select, Tooltip } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatActions } from "./components/chat_actions";
import { ChatInput } from "./components/chat_input";
import { ChatSession } from "./components/chat_session";
import { BlankDiv } from "./components/common";
import { ModelSettings } from "./components/model_settings";
import { PromptSettings } from "./components/prompt_settings";
import { ReferenceBox, addPageToReference } from "./components/references";
import { GeneralSettings } from "./components/settings";
import { useStorage } from "./hooks/useStorage";
import {
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

export const Assistant = () => {
  const [UILanguage, setUILanguage] = useStorage<string>("sync", "UILanguage", "en");
  const [chatLanguage, setChatLanguage] = useStorage<string>("sync", "chatLanguage", "English");
  const [modelName, setModelName] = useStorage<string>("local", "modelName", "");
  const [history, setHistory] = useStorage<Message[]>("local", "chatHistory", []);
  const [references, setReferences] = useStorage<Reference[]>("local", "references", []);
  const [chatTask, setChatTask] = useState<ChatTask | null>(null);
  const [chatStatus, setChatStatus] = useState("");
  const [openGeneralSettings, setOpenGeneralSettings] = useState(false);
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
    "customProviders",
    []
  );

  const chatHistoryRef = useRef(null);
  const allModels = [...SYSTEM_MODELS, ...customModels];
  const allProviders = [...SYSTEM_PROVIDERS, ...customProviders];

  const displayText = (text: string) => {
    return getLocaleMessage(UILanguage, text);
  };

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
      setChatTask(new ChatTask(displayText("prompt_summarizePage"), "page"));
    } else if (menuTask.name === WA_MENU_TASK_EXPLAIN_SELECTION) {
      setChatTask(new ChatTask(displayText("prompt_summarizeSelection"), "selection"));
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

  const clearAll = () => {
    setHistory([]);
    setChatStatus("");
    setChatTask(null);
    setReferences([]);
  };

  const enabledModels: [Model, ModelProvider][] = allProviders
    .map((p) => [p, providerConfigs[p.id]] as [ModelProvider, ProviderConfig])
    .filter(([p, c]) => c && c.enabled)
    .flatMap(([p, c]) =>
      allModels
        .filter((m) => m.providerId === p.id && c.enabledModels.includes(m.name))
        .map((m) => [m, p] as [Model, ModelProvider])
    );

  useEffect(() => {
    if (!enabledModels.map(([m, p]) => m.name).includes(modelName)) {
      if (enabledModels.length > 0) {
        setModelName(enabledModels[0][0].name);
      } else {
        setModelName("");
      }
    }
    console.debug("enabled models=", enabledModels);
  }, [providerConfigs, enabledModels]);

  return (
    <>
      <Drawer
        title={displayText("tooltip_generalSettings")}
        onClose={() => setOpenGeneralSettings(false)}
        open={openGeneralSettings}
        keyboard={false}
      >
        <GeneralSettings
          displayText={displayText}
          UILanguage={UILanguage}
          setUILanguage={setUILanguage}
          chatLanguage={chatLanguage}
          setChatLanguage={setChatLanguage}
        />
      </Drawer>
      <Drawer
        title={displayText("tooltip_promptSettings")}
        onClose={() => setOpenPromptSettings(false)}
        open={openPromptSettings}
        keyboard={false}
      >
        <PromptSettings
          displayText={displayText}
          promptTemplates={promptTemplates}
          setPromptTemplates={setPromptTemplates}
        />
      </Drawer>
      <Drawer
        title={displayText("tooltip_modelSettings")}
        onClose={() => setOpenModelSettings(false)}
        open={openModelSettings}
        keyboard={false}
      >
        <ModelSettings
          displayText={displayText}
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
          <Col span={22}>
            <Tooltip title={displayText("tooltip_generalSettings")}>
              <Button
                icon={<SettingOutlined />}
                type="text"
                size="middle"
                onClick={() => setOpenGeneralSettings(true)}
              />
            </Tooltip>
            <Tooltip title={displayText("tooltip_promptSettings")}>
              <Button
                icon={<MessageOutlined />}
                type="text"
                size="middle"
                onClick={() => setOpenPromptSettings(true)}
              />
            </Tooltip>
            <Tooltip title={displayText("tooltip_modelSettings")}>
              <Button
                icon={<DeploymentUnitOutlined />}
                type="text"
                size="middle"
                onClick={() => setOpenModelSettings(true)}
              />
            </Tooltip>
          </Col>
          <Col span={2}>
            <Tooltip title={displayText("tooltip_clearAll")}>
              <Button
                icon={<ClearOutlined />}
                type="text"
                size="middle"
                danger
                onClick={clearAll}
              />
            </Tooltip>
          </Col>
        </Row>

        <div id="references" style={{ padding: "8px 0px 8px 0px" }}>
          <ReferenceBox
            references={references}
            setReferences={setReferences}
            displayText={displayText}
          />
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
            displayText={displayText}
            chatLanguage={chatLanguage}
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
            enabledModels={enabledModels}
          />
          <ChatActions
            displayText={displayText}
            promptTemplates={promptTemplates}
            setChatTask={setChatTask}
            chatStatus={chatStatus}
          />
        </div>

        <div id="inputs" style={{ padding: "8px 4px 0px 4px" }}>
          {enabledModels.length > 0 && (
            <Select
              onChange={setModelName}
              value={modelName}
              style={{ width: "100%" }}
              placeholder="Select Model"
              options={enabledModels.map((m) => ({ value: m[0].name }))}
              showSearch
            />
          )}
          {enabledModels.length === 0 && (
            <Row>
              <Button
                icon={<DeploymentUnitOutlined />}
                type="text"
                size="middle"
                onClick={() => setOpenModelSettings(true)}
                danger
              >
                {displayText("tip_setUpModels")}
              </Button>
            </Row>
          )}
          <BlankDiv height={4} />
          <ChatInput
            displayText={displayText}
            enabled={chatTask === null && enabledModels.length > 0}
            setChatTask={setChatTask}
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
