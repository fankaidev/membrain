import { InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Tag } from "antd";
import React, { useContext } from "react";

import { TXT } from "../utils/locale";
import {
  CHAT_STATUS_EMPTY,
  CHAT_STATUS_PROCESSING,
  ChatTask,
  PromptTemplate,
} from "../utils/message";
import { ChatContext } from "./chat_context";
import { LocaleContext } from "./locale_context";

export const ChatActions = ({ promptTemplates }: { promptTemplates: PromptTemplate[] }) => {
  const { displayText } = useContext(LocaleContext)!;
  const { setChatTask, chatStatus } = useContext(ChatContext)!;

  const chatTasks: [string, ChatTask][] = [
    [
      displayText(TXT.ACTION_CHAT_SUMMARIZE),
      new ChatTask(displayText(TXT.PROMPT_SUMMARIZE), "all"),
    ],
    [
      displayText(TXT.ACTION_CHAT_SUMMARIZE_PAGE),
      new ChatTask(displayText(TXT.PROMPT_SUMMARIZE_PAGE), "page"),
    ],
    [
      displayText(TXT.ACTION_CHAT_SUMMARIZE_SELECTION),
      new ChatTask(displayText(TXT.PROMPT_SUMMARIZE_SELECTION), "selection"),
    ],
  ];

  for (const tpl of promptTemplates) {
    if (tpl.prompt.trim()) {
      chatTasks.push([tpl.name, new ChatTask(tpl.prompt, tpl.reference_type)]);
    }
  }

  const displayTag = () => {
    if (chatStatus === CHAT_STATUS_PROCESSING) {
      return (
        <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: "8px" }}>
          processing
        </Tag>
      );
    } else if (chatStatus !== CHAT_STATUS_EMPTY) {
      return (
        <Tag icon={<InfoCircleOutlined />} color="error" style={{ margin: "8px" }}>
          {chatStatus}
        </Tag>
      );
    }
  };

  const displayActions = () => {
    if (chatStatus !== CHAT_STATUS_PROCESSING) {
      return (
        <Flex id="actions" wrap="wrap" gap="small" style={{ margin: "8px" }}>
          {chatTasks.map(([title, task], index) => (
            <Button
              size="small"
              type="dashed"
              style={{ borderColor: "DeepSkyBlue" }}
              onClick={() => setChatTask(task)}
              key={index}
            >
              {title}
            </Button>
          ))}
        </Flex>
      );
    }
  };
  return (
    <>
      {displayTag()}
      {displayActions()}
    </>
  );
};
