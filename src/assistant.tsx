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
import { useReferenceState } from "./logic/reference_state";
import { TXT } from "./utils/locale";

export const Assistant = () => {
  const [openGeneralSettings, setOpenGeneralSettings] = useState(false);
  const [openPromptSettings, setOpenPromptSettings] = useState(false);
  const [openModelSettings, setOpenModelSettings] = useState(false);
  const { clearReferences } = useReferenceState();
  const { loadChatState, clearChatSession, history } = useChatState();
  const { loadAppState, displayText } = useAppState();
  const chatBoxRef = useRef(null);

  useEffect(() => {
    console.debug("init assistant");
    loadAppState();
    loadChatState();
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      const element = chatBoxRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const clearAll = () => {
    clearChatSession();
    clearReferences();
  };

  const Drawers = () => {
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
          <PromptSettings />
        </Drawer>
        <Drawer
          title={displayText(TXT.PAGE_MODEL_SETTINGS)}
          onClose={() => setOpenModelSettings(false)}
          open={openModelSettings}
          keyboard={false}
        >
          <ModelSettings />
        </Drawer>
      </>
    );
  };

  const Actions = () => {
    return (
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
    );
  };

  return (
    <>
      <Drawers />
      <Flex vertical justify="start" style={{ height: "100%", gap: "8px" }}>
        <Actions />
        <ReferenceBox />

        <div
          ref={chatBoxRef}
          style={{
            flex: "1 1",
            overflow: "auto",
            borderStyle: "solid none solid none",
            borderWidth: "1px",
            borderColor: "WhiteSmoke",
          }}
        >
          <ChatSession />
          <ChatActions />
        </div>

        <ChatInput setOpenModelSettings={setOpenModelSettings} />
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
