import {
  ClearOutlined,
  RobotOutlined,
  SendOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Tag, Tooltip } from "antd";
import markdownit from "markdown-it";
import React, { ChangeEvent } from "react";
import { ChatAction, Language } from "../utils/config";
import { getLocaleMessage } from "../utils/locale";
import { Message } from "../utils/message";

export const ChatActions = ({
  lang,
  processing,
  actions,
}: {
  lang: Language;
  processing: boolean;
  actions: ChatAction[];
}) => {
  return (
    <>
      {processing ? (
        <Tag icon={<SyncOutlined spin />} color="processing">
          processing
        </Tag>
      ) : (
        <Flex id="actions" wrap="wrap" gap="small">
          {actions.map((action) => (
            <Button size="small" type="dashed" onClick={action.func} key={action.name}>
              {getLocaleMessage(lang, action.name)}
            </Button>
          ))}
        </Flex>
      )}
    </>
  );
};

export const ChatHistory = ({ history }: { history: Message[] }) => {
  const md = markdownit();

  return (
    <>
      {history.map((item, index) => {
        const html = md.render(item.content);
        return (
          <div key={"history" + index}>
            <span>
              {item.model ? <RobotOutlined /> : <UserOutlined />}
              <em>
                <b>{item.model ? ` ${item.role}(${item.model})` : ` ${item.role}`}</b>
              </em>
            </span>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </>
  );
};

export const ChatInput = ({
  lang,
  userInput,
  processing,
  setUserInput,
  simpleChat,
  clearChats,
}: {
  lang: Language;
  userInput: string;
  processing: boolean;
  setUserInput: (value: string) => void;
  simpleChat: () => void;
  clearChats: () => void;
}) => {
  const handleUserInputChange = (e: ChangeEvent<any>) => {
    setUserInput(e.target.value);
  };

  const handleUserInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (processing) {
      return;
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      simpleChat();
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
          <Button icon={<SendOutlined />} type="text" size="middle" onClick={simpleChat} />
        </Tooltip>
        <Tooltip title={getLocaleMessage(lang, "tooltip_clearChats")}>
          <Button icon={<ClearOutlined />} type="text" size="middle" danger onClick={clearChats} />
        </Tooltip>
      </Flex>
    </>
  );
};
