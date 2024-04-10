import { InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Flex, Tag } from "antd";
import React, { useEffect } from "react";

import { useAppState } from "../logic/app_state";
import { useChatState } from "../logic/chat_state";
import { useReferenceState } from "../logic/reference_state";
import {
  WA_MENU_TASK_EXPLAIN_SELECTION,
  WA_MENU_TASK_SUMMARIZE_PAGE,
  WA_MESSAGE_TYPE_MENU_TASK,
} from "../utils/config";
import { TXT } from "../utils/locale";
import { CHAT_STATUS_EMPTY, CHAT_STATUS_PROCESSING, ChatTask } from "../utils/message";

export const ChatActions = () => {
  const { displayText } = useAppState();
  const { setChatTask, chatStatus, promptTemplates } = useChatState();
  const { addPageRef } = useReferenceState();

  // handle tasks from menu
  const checkNewTaskFromBackground = async () => {
    const { menuTask } = await chrome.storage.local.get("menuTask");
    if (!menuTask) {
      return;
    }
    const currentWindow = await chrome.windows.getCurrent();
    console.debug("get menu task=", menuTask, "current window=", currentWindow.id);
    if (menuTask.windowId !== currentWindow.id) {
      return;
    }
    chrome.storage.local.set({ menuTask: null });
    const pageRef = await addPageRef();
    if (!pageRef) {
      console.error("fail to get current page");
    } else if (menuTask.name === WA_MENU_TASK_SUMMARIZE_PAGE) {
      setChatTask(new ChatTask(displayText(TXT.PROMPT_SUMMARIZE_PAGE), "page"));
    } else if (menuTask.name === WA_MENU_TASK_EXPLAIN_SELECTION) {
      setChatTask(new ChatTask(displayText(TXT.PROMPT_SUMMARIZE_SELECTION), "selection"));
    } else {
      console.error("unknown menu task:", menuTask);
    }
  };

  useEffect(() => {
    console.debug("init message listener");
    chrome.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type == WA_MESSAGE_TYPE_MENU_TASK) {
        console.log("receive menu task message", message);
        checkNewTaskFromBackground();
      }
    });
    // invoke explicitly, as newly opened panels may miss above message
    checkNewTaskFromBackground();
  }, []);

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
