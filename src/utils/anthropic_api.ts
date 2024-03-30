import Anthropic from "@anthropic-ai/sdk";
import { Model } from "./config";
import { Message } from "./message";

const prepareChatData = (
  query_messages: Message[],
  model: string,
  temperature: number,
  max_tokens: number
) => {
  const system_msg = query_messages[0].content;
  const messages = query_messages
    .slice(1)
    .filter((message) => message.content && message.content.trim() != "<error>")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  const data = {
    model,
    system: system_msg,
    messages,
    temperature,
    max_tokens,
  };
  return data;
};

export const callClaude = async (
  apiKey: string,
  model: Model,
  messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const anthropic = new Anthropic({ apiKey });
  const data = prepareChatData(messages, model.name, 0.3, model.maxTokens);
  await anthropic.messages
    .stream(data)
    .on("text", (text) => {
      onContent(text);
    })
    .on("error", (error) => {
      onFinish(error.message);
    })
    .on("end", () => {
      onFinish();
    });
};
