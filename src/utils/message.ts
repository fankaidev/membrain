import { uniqueId } from "lodash";
import { v4 as uuidv4 } from "uuid";

export class Message {
  role: string;
  content: string;
  model: string;
  temperature: number;

  constructor(role: string, content: string, model: string = "", temperature: number = -1) {
    this.role = role;
    this.content = content;
    this.model = model;
    this.temperature = temperature;
  }
}

export type ReferenceType = "text" | "webpage";

export class Reference {
  id: string;
  type: ReferenceType;
  title: string;
  url: string;
  content: string;

  constructor(type: ReferenceType, title: string, url: string, content: string) {
    this.type = type;
    this.title = title;
    this.url = url;
    this.content = content;
    if (type === "webpage") {
      this.id = `${type}:${url}`;
    } else {
      this.id = `${type}:${title}`;
    }
  }
}

export type ChatReferenceType = "all" | "page" | "selection";

export class ChatTask {
  id: string;
  prompt: string;
  reference_type: ChatReferenceType;

  constructor(prompt: string, reference_type: ChatReferenceType) {
    this.prompt = prompt;
    this.reference_type = reference_type;
    this.id = new Date().toISOString() + "_" + uniqueId();
  }
}

export class PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  reference_type: ChatReferenceType;

  constructor(name: string, prompt: string, reference_type: ChatReferenceType) {
    this.id = uuidv4();
    this.name = name;
    this.prompt = prompt;
    this.reference_type = reference_type;
  }
}

export const CHAT_STATUS_PROCESSING = "__processing__";
export const CHAT_STATUS_EMPTY = "__empty__";
