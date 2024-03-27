import { uniqueId } from "lodash";

export class Message {
  role: string;
  content: string;
  model: string;

  constructor(role: string, content: string, model: string = "") {
    this.role = role;
    this.content = content;
    this.model = model;
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
  prompt: string;
  reference_type: ChatReferenceType;

  constructor(prompt: string, reference_type: ChatReferenceType) {
    this.prompt = prompt;
    this.reference_type = reference_type;
  }
}

export class PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  reference_type: ChatReferenceType;

  constructor(name: string, prompt: string, reference_type: ChatReferenceType) {
    this.id = uniqueId();
    this.name = name;
    this.prompt = prompt;
    this.reference_type = reference_type;
  }
}
