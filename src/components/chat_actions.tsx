import { SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Tag } from "antd";
import React from "react";
import { Language } from "../utils/config";
import { getLocaleMessage } from "../utils/locale";
import { ChatTask, PromptTemplate } from "../utils/message";

export const ChatActions = ({
  lang,
  inChatTask,
  setChatTask,
  promptTemplates,
}: {
  lang: Language;
  inChatTask: boolean;
  setChatTask: (task: ChatTask | null) => void;
  promptTemplates: PromptTemplate[];
}) => {
  const chatTasks: [string, ChatTask][] = [
    [
      getLocaleMessage(lang, "button_summarize"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarize"), "all"),
    ],
    [
      getLocaleMessage(lang, "button_summarizePage"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarizePage"), "page"),
    ],
    [
      getLocaleMessage(lang, "button_summarizeSelection"),
      new ChatTask(getLocaleMessage(lang, "prompt_summarizeSelection"), "selection"),
    ],
  ];

  for (const tpl of promptTemplates) {
    if (tpl.prompt.trim()) {
      chatTasks.push([tpl.name, new ChatTask(tpl.prompt, tpl.reference_type)]);
    }
  }

  return (
    <>
      {inChatTask ? (
        <Tag icon={<SyncOutlined spin />} color="processing" style={{ margin: "8px" }}>
          processing
        </Tag>
      ) : (
        <Flex id="actions" wrap="wrap" gap="small">
          {chatTasks.map(([title, task], index) => (
            <Button size="small" type="dashed" onClick={() => setChatTask(task)} key={index}>
              {title}
            </Button>
          ))}
        </Flex>
      )}
    </>
  );
};
