import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import markdownit from "markdown-it";
import React, { useEffect, useState } from "react";
import { callClaude } from "../utils/anthropic_api";
import { Language, MODELS, MODEL_PROVIDERS, ProviderConfig } from "../utils/config";
import { callGemini } from "../utils/google_api";
import { getLocaleMessage } from "../utils/locale";
import { ChatTask, Message, Reference } from "../utils/message";
import { callOpenAIApi } from "../utils/openai_api";
import { getCurrentSelection } from "../utils/page_content";
import { addPageToReference } from "./references";

export const ChatSession = ({
  lang,
  modelName,
  providerConfigs,
  references,
  chatTask,
  history,
  setReferences,
  setChatTask,
  setHistory,
}: {
  lang: Language;
  modelName: string;
  providerConfigs: Record<string, ProviderConfig>;
  references: Reference[];
  chatTask: ChatTask | null;
  history: Message[];
  setReferences: (value: Reference[]) => void;
  setChatTask: (task: ChatTask | null) => void;
  setHistory: (history: Message[]) => void;
}) => {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [round, setRound] = useState(0);
  const [processing, setProcessing] = useState(false);

  const md = markdownit();

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
    setChatTask(null);
  };

  const chatWithLLM = async (content: string, context_references: Reference[]) => {
    const query = new Message("user", content);
    const reply = new Message("assistant", "", modelName);
    setProcessing(true);
    setHistory([...history, query, reply]);
    setCurrentAnswer("");
    setRound((round) => round + 1);

    let systemPrompt = `${getLocaleMessage(lang, "prompt_system")}\n`;
    if (context_references.length > 0) {
      systemPrompt += `${getLocaleMessage(lang, "prompt_useReferences")}\n`;
      for (const [index, ref] of context_references.entries()) {
        systemPrompt += `${index + 1}: type=${ref.type}`;
        if (ref.type === "webpage") {
          systemPrompt += `, url=${ref.url}, title=${ref.title}`;
        }
        systemPrompt += `\n===\n${ref.content}\n===\n`;
      }
    }
    const systemMsg = new Message("system", systemPrompt);
    const messages = [systemMsg, ...history, query];
    const model = MODELS.find((m) => m.name === modelName);
    if (!model) {
      console.error("invalid model=", modelName);
      return;
    }
    const provider = MODEL_PROVIDERS.find((p) => p.name === model.provider);
    if (!provider) {
      console.error("invalid provider=", model.provider);
      return;
    }
    const apiKey = providerConfigs[model.provider]?.apiKey;
    if (!apiKey) {
      console.error("missing api key for provider=", model.provider);
      return;
    }
    if (provider.apiType === "Google") {
      callGemini(apiKey, model, messages, onResponseContent, onResponseFinish);
    } else if (provider.apiType === "Anthropic") {
      callClaude(apiKey, model, messages, onResponseContent, onResponseFinish);
    } else {
      callOpenAIApi(provider, apiKey, model, messages, onResponseContent, onResponseFinish);
    }
  };

  // handle chat task change
  useEffect(() => {
    if (!chatTask) {
      return;
    }
    if (!chatTask.prompt || processing) {
      console.error("invalid chat task=", chatTask, "processing=", processing);
      return;
    }
    console.log("chat task=", chatTask);
    if (chatTask.reference_type === "page") {
      console.debug("add page reference");
      addPageToReference(references, setReferences).then((pageRef) => {
        if (pageRef) {
          const prompt = `${getLocaleMessage(lang, "prompt_pageReference")}\n\n\`\`\`${
            pageRef.title
          }\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, [pageRef]);
        } else {
          setChatTask(null);
        }
      });
    } else if (chatTask.reference_type === "selection") {
      console.debug("add selection reference");
      getCurrentSelection().then((selection) => {
        if (selection) {
          console.log("selection is", selection);
          const prompt = `${getLocaleMessage(
            lang,
            "prompt_selectionReference"
          )}\n\n\`\`\`${selection}\`\`\`\n\n${chatTask.prompt}`;
          chatWithLLM(prompt, references);
        } else {
          setChatTask(null);
        }
      });
    } else {
      console.log("chat task=", chatTask.reference_type);

      chatWithLLM(chatTask.prompt, references);
    }
  }, [chatTask]);

  return (
    <>
      {history.map((item, index) => {
        const html = md.render(item.content);
        return (
          <div key={"history" + index}>
            <div style={{ fontSize: "1.2em" }}>
              {item.model ? "🤖" : "🙋"}
              <b>{item.model ? ` ${item.role}(${item.model})` : ` ${item.role}`}</b>
            </div>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </>
  );
};
