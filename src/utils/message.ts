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
