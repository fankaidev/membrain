import { sum } from "lodash";
import { OpenAI } from "openai";
import { Message } from "./message";

async function callModel(
  apiKey: string,
  baseURL: string,
  data: any,
  onFinish: (_?: string) => void,
  onContent: (_: string) => void
) {
  try {
    const openai = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    const stream = await openai.chat.completions.create(data);
    // @ts-ignore
    for await (const chunk of stream) {
      onContent(chunk.choices[0]?.delta?.content || "");
    }
    onFinish();
  } catch (error) {
    onFinish(error?.toString());
  }
}

function prepareChatData(
  query_messages: Message[],
  model: string,
  temperature: number,
  max_tokens: number
) {
  const messages = [];
  for (const message of query_messages) {
    if (message.content && message.content.trim() != "<error>") {
      messages.push({
        role: message.role,
        content: message.content,
      });
    }
  }
  const data = {
    model,
    messages,
    temperature,
    max_tokens,
    stream: true,
  };
  return data;
}

export const callKimi = async (
  apiKey: string,
  query_messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const url = "https://api.moonshot.cn/v1/";
  const data = prepareChatData(query_messages, "moonshot-v1-8k", 0.3, 2048);
  callModel(apiKey, url, data, onFinish, onContent);
};

export const callYi = async (
  apiKey: string,
  query_messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const url = "https://api.lingyiwanwu.com/v1/";
  const total_length = sum(query_messages.map((m) => m.content.length));
  const model = total_length < 3000 ? "yi-34b-chat-0205" : "yi-34b-chat-200k";
  const data = prepareChatData(query_messages, model, 0.3, 2048);
  callModel(apiKey, url, data, onFinish, onContent);
};

export const callBaichuan = async (
  apiKey: string,
  query_messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const url = "https://api.baichuan-ai.com/v1/";
  const data = prepareChatData(query_messages, "Baichuan2-Turbo", 0.3, 2048);
  callModel(apiKey, url, data, onFinish, onContent);
};

export const callOpenAI = async (
  apiKey: string,
  query_messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const url = "https://api.openai.com/v1/";
  const data = prepareChatData(query_messages, "gpt-3.5-turbo", 0.3, 2048);
  callModel(apiKey, url, data, onFinish, onContent);
};
