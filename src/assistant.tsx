import {
  ClearOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FileTextOutlined,
  RobotOutlined,
  SendOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Collapse, Flex, Input, Radio, Tag, Tooltip } from "antd";
import { SizeType } from "antd/es/config-provider/SizeContext";
import markdownit from "markdown-it";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useStorage } from "./hooks/useStorage";
import { callClaude } from "./utils/claude";
import {
  LLM_MODELS,
  WA_MESSAGE_TYPE_NEW_TASK,
  WA_TASK_EXPLAIN_SELECTION,
  WA_TASK_SUMMARIZE_PAGE
} from "./utils/config";
import { callGemini } from "./utils/gemini";
import { Message, Reference } from "./utils/message";
import { callBaichuan, callKimi, callOpenAI, callYi } from "./utils/openai";
import { getPageMarkDown, getPageSelectionText } from "./utils/page_content";

export const BlankDiv = ({ height }: { height?: number }) => {
  return <div style={{ height: `${height || 8}px`, margin: "0px", padding: "0px" }}></div>;
};

const Assistant = () => {
  const [apiKeys] = useStorage<{ [key: string]: string }>("sync", "apiKeys", {});
  const [model, setModel] = useStorage<string>("local", "model", "");
  const [history, setHistory] = useStorage<Message[]>("local", "chatHistory", []);
  const [references, setReferences] = useStorage<Reference[]>("local", "references", []);
  const [processing, setProcessing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [userInput, setUserInput] = useState("");
  const [task, setTask] = useState<string>();
  const [round, setRound] = useState(0);
  const chatHistoryRef = useRef(null);
  const md = markdownit();

  const checkNewTask = async () => {
    const { task } = await chrome.storage.local.get("task");
    if (!task) {
      return;
    }
    console.debug("get new task, task=", task);
    const currentWindow = await chrome.windows.getCurrent();
    if (task.windowId === currentWindow.id) {
      await chrome.storage.local.set({ task: null });
      // 需要通过effect来异步调用，因为这个时候model数据可能还没有ready
      setTask(task.name);
    }
  };

  useEffect(() => {
    console.debug("init assistant");
    chrome.runtime.onMessage.addListener((message: { type: string }) => {
      if (message.type == WA_MESSAGE_TYPE_NEW_TASK) {
        console.log("on message");
        checkNewTask();
      }
    });
    // 显式调用一次，因为对于刚打开的sidepanel，可能会错过message
    checkNewTask();
  }, []);

  useEffect(() => {
    if (!task) {
      return;
    }
    if (task === WA_TASK_SUMMARIZE_PAGE) {
      summarizePage();
    } else if (task === WA_TASK_EXPLAIN_SELECTION) {
      explainSelection();
    } else {
      console.error("unknown task:", task);
    }
    setTask("");
  }, [task]);

  const getCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.url) {
      return null;
    }
    if (tab.url!.includes("chrome://")) {
      console.debug("skip page:", tab.url ? tab.url : "");
      return null;
    }
    return tab;
  };

  const getCurrentSelection = async () => {
    const tab = await getCurrentTab();
    if (!tab) {
      return;
    }

    return await getPageSelectionText(tab);
  };

  const onResponseContent = (content: string) => {
    console.debug("on response content");
    setCurrentAnswer((answer) => answer + content);
  };

  const onResponseFinish = (errorMsg: string = "") => {
    console.log("on response finish, errorMsg=", errorMsg);
    if (errorMsg) {
      setCurrentAnswer((answer) => answer + ` [ERROR]:${errorMsg}`);
    }
    setProcessing(false);
  };

  useEffect(() => {
    if (!currentAnswer) {
      return;
    }
    console.debug(`update history on answer change of round ${round}`);
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === "assistant") {
        setHistory([
          ...history.slice(0, -1),
          new Message(lastMsg.role, currentAnswer, lastMsg.model),
        ]);
      }
    }
  }, [currentAnswer, round]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      const element = chatHistoryRef.current as HTMLElement;
      element.scrollTop = element.scrollHeight;
    }
  }, [history]);

  const chatWithLLM = async (content: string, context_references: Reference[] = references) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", model);
    setProcessing(true);
    setHistory([...history, query, reply]);
    setCurrentAnswer("");
    setRound((round) => round + 1);

    let systemPrompt = `你是一个智能助手，请你尽量准确的回答用户的问题。\n`;
    if (context_references.length > 0) {
      systemPrompt += `你应当参考以下的资料来回答：\n`;
      for (const [index, ref] of context_references.entries()) {
        systemPrompt += `资料${index + 1}: type=${ref.type}`;
        if (ref.type === "webpage") {
          systemPrompt += `, url=${ref.url}, title=${ref.title}`;
        }
        systemPrompt += `\n===\n${ref.content}\n===\n`;
      }
    }
    const systemMsg = new Message("system", systemPrompt);
    const messages = [systemMsg, ...history, query];
    const apiKey = apiKeys[model];
    if (model === "Kimi") {
      callKimi(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Yi") {
      callYi(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Gemini") {
      callGemini(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Claude") {
      callClaude(apiKey, messages, onResponseContent, onResponseFinish);
    } else if (model === "Baichuan") {
      callBaichuan(apiKey, messages, onResponseContent, onResponseFinish);
    } else {
      callOpenAI(apiKey, messages, onResponseContent, onResponseFinish);
    }
  };

  const addPageToReference = async (): Promise<Reference | null> => {
    const tab = await getCurrentTab();
    if (!tab) {
      return null;
    }

    const content = await getPageMarkDown(tab);
    if (!content) {
      return null;
    }
    const pageRef = new Reference("webpage", tab.title!, tab.url!, content);

    if (references.filter((r) => r.type === "webpage" && r.url === pageRef.url).length == 0) {
      setReferences([...references, pageRef]);
    } else {
      console.debug("skip adding existing reference");
    }
    return pageRef;
  };

  const addSelectionToReference = async (): Promise<Reference | null> => {
    const selectionText = await getCurrentSelection();
    if (selectionText) {
      const selectionRef = new Reference("text", ellipse(selectionText, 20), "", selectionText);
      setReferences([...references, selectionRef]);
      return selectionRef;
    } else {
      return null;
    }
  };

  const clearReferences = () => {
    setReferences([]);
  };

  const removeReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
  };

  const summarize = async () => {
    if (references.length > 0) {
      chatWithLLM("总结参考资料里的内容");
    }
  };

  const summarizePage = async () => {
    const pageRef = await addPageToReference();
    if (pageRef) {
      chatWithLLM(`总结这个网页的内容: ${pageRef.title}`, [pageRef]);
    }
  };

  const explainSelection = async () => {
    const pageRef = await addPageToReference();
    const selectionText = await getCurrentSelection();
    if (pageRef && selectionText) {
      chatWithLLM(`请具体分析网页中的这段内容:\n\n${selectionText}\n`, [pageRef]);
    }
  };

  const simpleChat = async () => {
    setUserInput("");
    chatWithLLM(userInput.trim());
  };

  const clearAll = () => {
    setHistory([]);
    setReferences([]);
  };

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

  const selectModel = (e: any) => {
    setModel(e.target.value);
  };

  const displayHistory = () => {
    return history.map((item, index) => {
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
    });
  };
  const displayReferences = () => {
    const displayRemoveReferenceIcon = (ref: Reference) => {
      return (
        <DeleteOutlined
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            removeReference(ref.id);
          }}
        />
      );
    };

    const panels = references.map((ref, index) => {
      const html = md.render(ref.content);
      return (
        <Collapse.Panel
          header={ellipse(`${ref.type}: ${ref.title}`) + ` (${ref.content.length})`}
          key={"ref" + index}
          extra={displayRemoveReferenceIcon(ref)}
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Collapse.Panel>
      );
    });

    return <Collapse style={{ width: "100%" }}>{panels}</Collapse>;
  };
  const ellipse = (text: string, limit: number = 70) => {
    let ret = "";
    let cost = 0;
    for (let i = 0; i < text.length; i++) {
      cost += text.charCodeAt(i) > 0x7f ? 2 : 1;
      if (cost > limit) {
        return ret + "...";
      }
      ret += text[i];
    }

    return ret;
  };

  const iconButton = (
    icon: any,
    tooltip: string,
    size: SizeType,
    isDanger: boolean,
    onClick: () => void
  ) => {
    return (
      <Tooltip title={tooltip}>
        <Button icon={icon} type="text" size={size} danger={isDanger} onClick={onClick} />
      </Tooltip>
    );
  };

  return (
    <>
      <Flex
        vertical
        justify="start"
        style={{
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div id="references">
          <BlankDiv height={8} />
          {references.length > 0 && displayReferences()}
          {references.length > 0 && <BlankDiv height={4} />}
          <Flex id="reference_actions" justify="space-between">
            <Tag>{`${references.length} References`}</Tag>
            <span>
              {iconButton(
                <FileAddOutlined />,
                "add current page",
                "small",
                false,
                addPageToReference
              )}
              {iconButton(
                <FileTextOutlined />,
                "add selection",
                "small",
                false,
                addSelectionToReference
              )}
              {iconButton(<DeleteOutlined />, "delete all", "small", true, clearReferences)}
            </span>
          </Flex>
          <BlankDiv height={8} />
        </div>

        <div
          id="chats"
          ref={chatHistoryRef}
          style={{
            flex: "1 1",
            overflow: "auto",
            borderStyle: "solid none solid none",
            borderWidth: "1px",
            borderColor: "WhiteSmoke",
          }}
        >
          <BlankDiv height={8} />
          {displayHistory()}
          {processing ? (
            <Tag icon={<SyncOutlined spin />} color="processing">
              processing
            </Tag>
          ) : (
            <Flex id="actions" wrap="wrap" gap="small">
              <Button size="small" type="dashed" onClick={summarize}>
                Summarize
              </Button>
              <Button size="small" type="dashed" onClick={summarizePage}>
                Summarize Page
              </Button>
              <Button size="small" type="dashed" onClick={explainSelection}>
                Explain Selection
              </Button>
            </Flex>
          )}
          <BlankDiv height={8} />
        </div>

        <div id="inputs" style={{ padding: "8px 4px 0px 4px" }}>
          <Radio.Group onChange={selectModel} value={model}>
            {LLM_MODELS.map((m: string) => (
              <Radio value={m} key={m} disabled={!apiKeys[m]}>
                {m}
              </Radio>
            ))}
          </Radio.Group>
          <Flex dir="row" gap={4}>
            <Input.TextArea
              value={userInput}
              placeholder="Ask Assistant"
              onChange={handleUserInputChange}
              onKeyDown={handleUserInputKeyDown}
              autoSize
              allowClear
            />
            {iconButton(<SendOutlined />, "send(cmd+enter)", "middle", false, simpleChat)}
            {iconButton(<ClearOutlined />, "clear all", "middle", true, clearAll)}
          </Flex>
        </div>
        <BlankDiv height={8} />
      </Flex>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Assistant />
  </React.StrictMode>
);
