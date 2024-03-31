import { SendOutlined } from "@ant-design/icons";
import { Flex, Input } from "antd";
import React, { ChangeEvent, useContext, useState } from "react";
import { TXT } from "../utils/locale";
import { ChatTask } from "../utils/message";
import { ChatContext } from "./chat_context";
import { IconButton } from "./icon_button";
import { LocaleContext } from "./locale_context";

export const ChatInput = ({ enabled }: { enabled: boolean }) => {
  const [userInput, setUserInput] = useState("");

  const { displayText } = useContext(LocaleContext)!;
  const { setChatTask } = useContext(ChatContext)!;

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
          placeholder={displayText(TXT.INPUT_CHAT_PLACEHOLDER)}
          onChange={handleUserInputChange}
          onKeyDown={handleUserInputKeyDown}
          autoSize
          allowClear
        />
        <IconButton icon={<SendOutlined />} onClick={chat} size="middle" />
      </Flex>
    </>
  );
};
