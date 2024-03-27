import { ClearOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Tooltip } from "antd";
import React, { ChangeEvent, useState } from "react";
import { Language } from "../utils/config";
import { getLocaleMessage } from "../utils/locale";
import { ChatTask } from "../utils/message";

export const ChatInput = ({
  lang,
  inChatTask,
  setChatTask,
  clearChatSession,
}: {
  lang: Language;
  inChatTask: boolean;
  setChatTask: (task: ChatTask | null) => void;
  clearChatSession: () => void;
}) => {
  const [userInput, setUserInput] = useState("");

  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const chat = () => {
    if (inChatTask || !userInput.trim()) {
      return;
    }
    setChatTask(new ChatTask(userInput.trim(), "all"));
    setUserInput("");
  };

  const handleUserInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      chat();
    }
  };

  return (
    <>
      <Flex dir="row" gap={4}>
        <Input.TextArea
          value={userInput}
          placeholder={getLocaleMessage(lang, "input_placeholder")}
          onChange={handleUserInputChange}
          onKeyDown={handleUserInputKeyDown}
          autoSize
          allowClear
        />

        <Tooltip title={getLocaleMessage(lang, "tooltip_sendMessage")}>
          <Button icon={<SendOutlined />} type="text" size="middle" onClick={chat} />
        </Tooltip>
        <Tooltip title={getLocaleMessage(lang, "tooltip_clearChats")}>
          <Button
            icon={<ClearOutlined />}
            type="text"
            size="middle"
            danger
            onClick={clearChatSession}
          />
        </Tooltip>
      </Flex>
    </>
  );
};
