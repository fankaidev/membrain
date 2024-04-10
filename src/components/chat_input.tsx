import { CloseCircleOutlined, DeploymentUnitOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Row, Select } from "antd";
import React, { ChangeEvent, useState } from "react";
import { useAppState } from "../logic/app_state";
import { useChatState } from "../logic/chat_state";
import { TXT } from "../utils/locale";
import { CHAT_STATUS_PROCESSING, ChatTask } from "../utils/message";
import { BlankDiv } from "./common";
import { IconButton } from "./icon_button";

export const ChatInput = ({
  setOpenModelSettings,
}: {
  setOpenModelSettings: (value: boolean) => void;
}) => {
  const [userInput, setUserInput] = useState("");
  const { displayText } = useAppState();
  const {
    setChatTask,
    getCurrentModel,
    getEnabledModels,
    setSelectedModel,
    chatStatus,
    loaded: loadedChatState,
  } = useChatState();
  const enabledModels = getEnabledModels();
  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const sendChat = () => {
    if (!userInput.trim()) {
      return;
    }
    if (!getCurrentModel() || chatStatus === CHAT_STATUS_PROCESSING) {
      return;
    }
    setChatTask(new ChatTask(userInput.trim(), "all"));
    setUserInput("");
  };

  const stopChat = () => {
    setChatTask(null);
  };

  const handleUserInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div style={{ paddingLeft: "4px", paddingRight: "4px" }}>
      {enabledModels.length > 0 && (
        <Select
          onChange={(val) => setSelectedModel(val ? JSON.parse(val) : null)}
          value={getCurrentModel() ? JSON.stringify(getCurrentModel()) : ""}
          style={{ width: "100%" }}
          placeholder="Select Model"
          options={enabledModels.map((m) => ({ value: JSON.stringify(m), label: m.model.name }))}
          showSearch
        />
      )}
      {loadedChatState && enabledModels.length === 0 && (
        <Row>
          <Button
            icon={<DeploymentUnitOutlined />}
            type="text"
            size="middle"
            onClick={() => setOpenModelSettings(true)}
            danger
          >
            {displayText(TXT.TIP_SET_UP_MODELS)}
          </Button>
        </Row>
      )}
      <BlankDiv height={4} />
      <Flex dir="row" gap={4}>
        <Input.TextArea
          value={userInput}
          placeholder={displayText(TXT.INPUT_CHAT_PLACEHOLDER)}
          onChange={handleUserInputChange}
          onKeyDown={handleUserInputKeyDown}
          autoSize
          allowClear
        />
        {chatStatus === CHAT_STATUS_PROCESSING ? (
          <IconButton icon={<CloseCircleOutlined />} onClick={stopChat} size="middle" />
        ) : (
          <IconButton icon={<SendOutlined />} onClick={sendChat} size="middle" />
        )}
      </Flex>
    </div>
  );
};
