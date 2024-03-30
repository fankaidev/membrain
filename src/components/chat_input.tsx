import { SendOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Tooltip } from "antd";
import React, { ChangeEvent, useState } from "react";
import { ChatTask } from "../utils/message";

export const ChatInput = ({
  displayText,
  enabled,
  setChatTask,
}: {
  displayText: (text: string) => string;
  enabled: boolean;
  setChatTask: (task: ChatTask | null) => void;
}) => {
  const [userInput, setUserInput] = useState("");

  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const chat = () => {
    if (!enabled || !userInput.trim()) {
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
          placeholder={displayText("input_placeholder")}
          onChange={handleUserInputChange}
          onKeyDown={handleUserInputKeyDown}
          autoSize
          allowClear
        />
        <Tooltip title={displayText("tooltip_sendMessage")}>
          <Button icon={<SendOutlined />} type="text" size="middle" onClick={chat} />
        </Tooltip>
      </Flex>
    </>
  );
};
