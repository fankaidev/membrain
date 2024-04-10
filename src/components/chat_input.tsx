import { CloseCircleOutlined, DeploymentUnitOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Row, Select } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useAppState } from "../logic/app_state";
import { useChatState } from "../logic/chat_state";
import { Model, ModelAndProvider, ModelProvider, ProviderConfig } from "../utils/config";
import { TXT } from "../utils/locale";
import { CHAT_STATUS_PROCESSING, ChatTask } from "../utils/message";
import { BlankDiv } from "./common";
import { IconButton } from "./icon_button";

export const ChatInput = ({
  currentModel,
  allModels,
  allProviders,
  providerConfigs,
  setCurrentModel,
  setOpenModelSettings,
}: {
  currentModel: ModelAndProvider | null;
  allModels: Model[];
  allProviders: ModelProvider[];
  providerConfigs: Record<string, ProviderConfig>;
  setCurrentModel: (value: ModelAndProvider | null) => void;
  setOpenModelSettings: (value: boolean) => void;
}) => {
  const [userInput, setUserInput] = useState("");
  const { displayText } = useAppState();
  const { setChatTask, chatStatus } = useChatState();

  const enabledModels: ModelAndProvider[] = allProviders
    .map((p) => [p, providerConfigs[p.id]] as [ModelProvider, ProviderConfig])
    .filter(([p, c]) => c && c.enabled)
    .flatMap(([p, c]) =>
      allModels
        .filter((m) => m.providerId === p.id && c.enabledModels.includes(m.name))
        .map((m) => new ModelAndProvider(m, p)),
    );

  const isCurrentModelValid = (): boolean => {
    if (currentModel === null) {
      return false;
    }
    const { model, provider } = currentModel;
    return !!enabledModels.find((mp) => mp.model.id == model.id && mp.provider.id == provider.id);
  };

  useEffect(() => {
    if (enabledModels.length === 0 && currentModel !== null) {
      setCurrentModel(null);
    }
    if (enabledModels.length > 0 && !isCurrentModelValid()) {
      setCurrentModel(enabledModels[0]);
    }
    console.debug("enabled models=", enabledModels);
  }, [providerConfigs, enabledModels]);

  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const sendChat = () => {
    if (!userInput.trim()) {
      return;
    }
    if (!isCurrentModelValid() || chatStatus === CHAT_STATUS_PROCESSING) {
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
          onChange={(val) => setCurrentModel(val ? JSON.parse(val) : null)}
          value={currentModel ? JSON.stringify(currentModel) : ""}
          style={{ width: "100%" }}
          placeholder="Select Model"
          options={enabledModels.map((m) => ({ value: JSON.stringify(m), label: m.model.name }))}
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
