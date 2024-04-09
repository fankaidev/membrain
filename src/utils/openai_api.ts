import { OpenAI } from "openai";
import { Model, ModelProvider } from "./config";
import { Message } from "./message";

function prepareChatData(
  query_messages: Message[],
  model: string,
  temperature: number,
  max_tokens: number,
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
  const data: any = {
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
  temperature: number,
  query_messages: Message[],
  chatId: string,
  onContent: (chatId: string, content: string) => void,
  onFinish: (chatId: string, error?: string) => void,
) => {
  // TODO: calculate remaining max output tokens
  const data = prepareChatData(query_messages, model.name, temperature, model.maxOutput / 2);

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: provider.endpoint,
      dangerouslyAllowBrowser: true,
    });
    const stream = await openai.chat.completions.create(data);
    // @ts-ignore
    for await (const chunk of stream) {
      onContent(chatId, chunk.choices[0]?.delta?.content || "");
    }
    onFinish(chatId);
  } catch (error) {
    onFinish(chatId, error?.toString());
  }
};
