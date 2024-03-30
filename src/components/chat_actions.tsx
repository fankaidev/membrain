import { InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Tag } from "antd";
import React from "react";
import { ChatTask, PromptTemplate } from "../utils/message";

export const ChatActions = ({
  displayText,
  setChatTask,
  promptTemplates,
  chatStatus,
}: {
  displayText: (text: string) => string;
  setChatTask: (task: ChatTask | null) => void;
  promptTemplates: PromptTemplate[];
  chatStatus: string;
}) => {
  const chatTasks: [string, ChatTask][] = [
    [displayText("button_summarize"), new ChatTask(displayText("prompt_summarize"), "all")],
    [
      displayText("button_summarizePage"),
      new ChatTask(displayText("prompt_summarizePage"), "page"),
    ],
    [
      displayText("button_summarizeSelection"),
      new ChatTask(displayText("prompt_summarizeSelection"), "selection"),
    ],
  ];

  for (const tpl of promptTemplates) {
    if (tpl.prompt.trim()) {
      chatTasks.push([tpl.name, new ChatTask(tpl.prompt, tpl.reference_type)]);
    }
  }

  return (
    <>
      {chatStatus === "processing" && (
        <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: "8px" }}>
          {chatStatus}
        </Tag>
      )}
      {chatStatus && chatStatus !== "processing" && (
        <Tag icon={<InfoCircleOutlined />} color="error" style={{ margin: "8px" }}>
          {chatStatus}
        </Tag>
      )}
      <Flex id="actions" wrap="wrap" gap="small">
        {chatTasks.map(([title, task], index) => (
          <Button size="small" type="dashed" onClick={() => setChatTask(task)} key={index}>
            {title}
          </Button>
        ))}
      </Flex>
    </>
  );
};
