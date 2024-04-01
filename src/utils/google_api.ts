import { Content, GoogleGenerativeAI } from "@google/generative-ai";
import { Model } from "./config";
import { Message } from "./message";

function prepareHistory(messages: Message[]) {
  const history: Content[] = [];
  for (const message of messages.slice(0, -1)) {
    if (message.content && message.content.trim() != "<error>") {
      history.push({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      });
    }
  }
  return history;
}

export const callGemini = async (
  apiKey: string,
  model: Model,
  temperature: number,
  messages: Message[],
  onContent: (_: string) => void,
  onFinish: (_?: string) => void
) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({ model: model.name });
    if (messages.length > 1) {
      const first = new Message("user", messages[0].content + "\n\n" + messages[1].content);
      messages = [first, ...messages.slice(2)];
    }
    const history = prepareHistory(messages);
    // TODO: calculate remaining max output tokens
    const chat = genModel.startChat({
      history,
      generationConfig: {
        maxOutputTokens: model.maxOutput / 2,
        temperature: temperature,
      },
    });
    const result = await chat.sendMessageStream(messages[messages.length - 1].content);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      onContent(text);
      console.debug("receive chunk:", text);
    }
    onFinish();
  } catch (error) {
    onFinish(error?.toString());
  }
};
