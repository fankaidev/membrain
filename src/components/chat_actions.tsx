import { InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Tag } from "antd";
import React, { useContext } from "react";

import { TXT } from "../utils/locale";
import { CHAT_STATUS_PROCESSING, ChatTask, PromptTemplate } from "../utils/message";
import { LocaleContext } from "./locale_context";

export const ChatActions = ({
  setChatTask,
  promptTemplates,
  chatStatus,
}: {
  setChatTask: (task: ChatTask | null) => void;
  promptTemplates: PromptTemplate[];
  chatStatus: string;
}) => {
  const { displayText } = useContext(LocaleContext)!;

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

  return (
    <>
      {chatStatus === CHAT_STATUS_PROCESSING && (
        <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: "8px" }}>
          {chatStatus}
        </Tag>
      )}
      {chatStatus && chatStatus !== CHAT_STATUS_PROCESSING && (
        <Tag icon={<InfoCircleOutlined />} color="error" style={{ margin: "8px" }}>
          {chatStatus}
        </Tag>
      )}
      {chatStatus !== CHAT_STATUS_PROCESSING && (
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
      )}
    </>
  );
};
