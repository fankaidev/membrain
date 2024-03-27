import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import { Message } from "./message";
import { Model } from "./config";

function prepareChatData(
  query_messages: Message[],
  model: string,
  temperature: number,
  max_tokens: number
) {
  const messages: MessageParam[] = [];
  for (const message of query_messages) {
    if (message.content && message.content.trim() != "<error>") {
      messages.push({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      });
    }
  }
  const data = {
    model,
    messages,
    temperature,
    max_tokens,
  };
  return data;
}

export const callClaude = async (
  apiKey: string,
  model: Model,
  messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  const anthropic = new Anthropic({ apiKey });
  if (messages.length > 1) {
    const first = new Message("user", messages[0].content + "\n\n" + messages[1].content);
    messages = [first, ...messages.slice(2)];
  }
  const data = prepareChatData(messages, model.name, 0.3, model.maxTokens);
  await anthropic.messages
    .stream(data)
    .on("text", (text) => {
      onContent(text);
    })
    .on("error", (error) => {
      onFinish(error.message);
    });
  onFinish();
};
