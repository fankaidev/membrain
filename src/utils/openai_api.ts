import { OpenAI } from "openai";
import { Model, ModelProvider } from "./config";
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

export const callOpenAIApi = async (
  provider: ModelProvider,
  apiKey: string,
  model: Model,
  query_messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  // TODO: calculate remaining max output tokens
  const data = prepareChatData(query_messages, model.name, 0.3, model.maxOutput / 2);
  callModel(apiKey, provider.endpoint, data, onFinish, onContent);
};
