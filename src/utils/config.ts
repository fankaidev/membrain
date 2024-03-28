import { v4 as uuidv4 } from "uuid";

export type Language = "en" | "zh";

export const WA_MENU_TASK_SUMMARIZE_PAGE = "summarize_page";
export const WA_MENU_TASK_EXPLAIN_SELECTION = "explain_selection";

export const WA_MESSAGE_TYPE_MENU_TASK = "web_assistant_new_task";
export const WA_MESSAGE_TYPE_OPEN = "web_assistant_open";

export const WA_MENU_OPEN = "web_assistant_open";
export const WA_MENU_SUMMARIZE_PAGE = "web_assistant_summarize_page";
export const WA_MENU_EXPLAIN_SELECTION = "web_assistant_explain_selection";

export type ModelApiType = "OpenAI" | "Google" | "Anthropic";
export const LLM_MODELS = ["OpenAI", "Claude", "Gemini", "Kimi", "Yi", "Baichuan"];

export class Model {
  id: string;
  providerId: string;
  name: string;
  maxTokens: number;

  constructor(providerId: string, name: string, maxTokens: number, id?: string) {
    this.id = id || uuidv4();
    this.providerId = providerId;
    this.name = name;
    this.maxTokens = maxTokens;
  }
}

export class ModelProvider {
  id: string;
  name: string;
  apiType: ModelApiType;
  endpoint: string;

  constructor(name: string, apiType: ModelApiType, endpoint: string, id?: string) {
    this.id = id || uuidv4();
    this.name = name;
    this.apiType = apiType;
    this.endpoint = endpoint;
  }
}

export class ProviderConfig {
  providerId: string;
  enabled: boolean;
  apiKey: string;
  enabledModels: string[];

  constructor(providerId: string, enabled: boolean, apiKey: string, enabledModels: string[]) {
    this.providerId = providerId;
    this.enabled = enabled;
    this.apiKey = apiKey;
    this.enabledModels = enabledModels;
  }
}

const OpenAI = new ModelProvider("OpenAI", "OpenAI", "https://api.openai.com/v1/", "OpenAI");
const Anthropic = new ModelProvider("Anthropic", "Anthropic", "", "Anthropic");
const Google = new ModelProvider("Google", "Google", "", "Google");
const Moonshot = new ModelProvider("Moonshot", "OpenAI", "https://api.moonshot.cn/v1/", "Moonshot");
const Yi = new ModelProvider("Yi", "OpenAI", "https://api.lingyiwanwu.com/v1/", "Yi");

export const SYSTEM_PROVIDERS: ModelProvider[] = [OpenAI, Anthropic, Google, Moonshot, Yi];

export const SYSTEM_MODELS: Model[] = [
  new Model(OpenAI.id, "gpt-3.5-turbo", 4 * 1024),
  new Model(OpenAI.id, "gpt-4", 4 * 1024),
  new Model(Anthropic.id, "claude-3-haiku-20240307", 128 * 1024),
  new Model(Anthropic.id, "claude-3-sonnet-20240229", 128 * 1024),
  new Model(Anthropic.id, "claude-3-opus-20240229", 128 * 1024),
  new Model(Google.id, "gemini-pro", 8 * 1024),
  new Model(Moonshot.id, "moonshot-v1-8k", 8 * 1024),
  new Model(Moonshot.id, "moonshot-v1-32k", 32 * 1024),
  new Model(Yi.id, "yi-34b-chat-0205", 4 * 1024),
  new Model(Yi.id, "yi-34b-chat-200k", 128 * 1024),
];
