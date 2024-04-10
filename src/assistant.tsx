import {
  ClearOutlined,
  DeploymentUnitOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Col, Drawer, Flex, Row } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatActions } from "./components/chat_actions";
import { ChatInput } from "./components/chat_input";
import { ChatSession } from "./components/chat_session";
import { IconButton } from "./components/icon_button";
import { ModelSettings } from "./components/model_settings";
import { PromptSettings } from "./components/prompt_settings";
import { ReferenceBox } from "./components/references";
import { GeneralSettings } from "./components/settings";
import { useAppState } from "./logic/app_state";
import { useChatState } from "./logic/chat_state";
import { useLocalStorage, useSyncStorage } from "./logic/chrome_storage";
import { useReferenceState } from "./logic/reference_state";
import {
  Model,
  ModelAndProvider,
  ModelProvider,
  ProviderConfig,
  SYSTEM_MODELS,
  SYSTEM_PROVIDERS,
  WA_MENU_TASK_EXPLAIN_SELECTION,
  WA_MENU_TASK_SUMMARIZE_PAGE,
  WA_MESSAGE_TYPE_MENU_TASK,
} from "./utils/config";
import { TXT } from "./utils/locale";
import { CHAT_STATUS_EMPTY, ChatTask, Message, PromptTemplate } from "./utils/message";

export const Assistant = () => {
  const [currentModel, setCurrentModel] = useState<ModelAndProvider | null>(null);
  const [history, setHistory] = useLocalStorage<Message[]>("chatHistory", []);
  const [openGeneralSettings, setOpenGeneralSettings] = useState(false);
  const [openPromptSettings, setOpenPromptSettings] = useState(false);
  const [openModelSettings, setOpenModelSettings] = useState(false);
  const [promptTemplates, setPromptTemplates] = useSyncStorage<PromptTemplate[]>(
    "promptTemplates",
    [],
  );
  const [customModels, setCustomModels] = useSyncStorage<Model[]>("customModels", []);
  const [customProviders, setCustomProviders] = useSyncStorage<ModelProvider[]>(
    "customProviders",
    [],
  );
  const [providerConfigs, setProviderConfigs] = useSyncStorage<Record<string, ProviderConfig>>(
    "providerConfigs",
    {},
  );
  const chatBoxRef = useRef(null);
  const allModels = [...SYSTEM_MODELS, ...customModels];
  const allProviders = [...SYSTEM_PROVIDERS, ...customProviders];
  const { addPageRef, clearReferences } = useReferenceState();
  const { setChatTask, setChatStatus, loadChatState } = useChatState();
  const { loadAppState, displayText } = useAppState();

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
    const pageRef = await addPageRef();
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
    loadAppState();
    loadChatState();
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
    if (chatBoxRef.current) {
      const element = chatBoxRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const clearAll = () => {
    setHistory([]);
    setChatTask(null);
    setChatStatus(CHAT_STATUS_EMPTY);
    clearReferences();
  };

  const settings = () => {
    return (
      <>
        <Drawer
          title={displayText(TXT.PAGE_GENERAL_SETTINGS)}
          onClose={() => setOpenGeneralSettings(false)}
          open={openGeneralSettings}
          keyboard={false}
        >
          <GeneralSettings />
        </Drawer>
        <Drawer
          title={displayText(TXT.PAGE_PROMPT_SETTINGS)}
          onClose={() => setOpenPromptSettings(false)}
          open={openPromptSettings}
          keyboard={false}
        >
          <PromptSettings
            promptTemplates={promptTemplates}
            setPromptTemplates={setPromptTemplates}
          />
        </Drawer>
        <Drawer
          title={displayText(TXT.PAGE_MODEL_SETTINGS)}
          onClose={() => setOpenModelSettings(false)}
          open={openModelSettings}
          keyboard={false}
        >
          <ModelSettings
            providerConfigs={providerConfigs}
            setProviderConfigs={setProviderConfigs}
            customModels={customModels}
            setCustomModels={setCustomModels}
            customProviders={customProviders}
            setCustomProviders={setCustomProviders}
          />
        </Drawer>
      </>
    );
  };

  return (
    <>
      {settings()}
      <Flex vertical justify="start" style={{ height: "100%", gap: "8px" }}>
        <Row id="settings">
          <Col span={22}>
            <IconButton
              icon={<SettingOutlined />}
              onClick={() => setOpenGeneralSettings(true)}
              size="middle"
              tooltip={TXT.PAGE_GENERAL_SETTINGS}
            />
            <IconButton
              icon={<MessageOutlined />}
              onClick={() => setOpenPromptSettings(true)}
              size="middle"
              tooltip={TXT.PAGE_PROMPT_SETTINGS}
            />
            <IconButton
              icon={<DeploymentUnitOutlined />}
              onClick={() => setOpenModelSettings(true)}
              size="middle"
              tooltip={TXT.PAGE_MODEL_SETTINGS}
            />
          </Col>
          <Col span={2}>
            <IconButton
              icon={<ClearOutlined />}
              onClick={clearAll}
              size="middle"
              tooltip={TXT.ACTION_CLEAR_ALL}
              style={{ color: "red" }}
            />
          </Col>
        </Row>

        <div id="references">
          <ReferenceBox />
        </div>

        <div
          id="chats"
          ref={chatBoxRef}
          style={{
            flex: "1 1",
            overflow: "auto",
            borderStyle: "solid none solid none",
            borderWidth: "1px",
            borderColor: "WhiteSmoke",
          }}
        >
          <ChatSession
            currentModel={currentModel}
            providerConfigs={providerConfigs}
            history={history}
            setHistory={setHistory}
          />
          <ChatActions promptTemplates={promptTemplates} />
        </div>

        <div id="chat_input">
          <ChatInput
            allModels={allModels}
            allProviders={allProviders}
            providerConfigs={providerConfigs}
            currentModel={currentModel}
            setCurrentModel={setCurrentModel}
            setOpenModelSettings={setOpenModelSettings}
          />
        </div>
      </Flex>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Assistant />
  </React.StrictMode>,
);
