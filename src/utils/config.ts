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
  provider: string;
  name: string;
  maxTokens: number;

  constructor(provider: string, name: string, maxTokens: number) {
    this.provider = provider;
    this.name = name;
    this.maxTokens = maxTokens;
  }
}

export class ModelProvider {
  name: string;
  apiType: ModelApiType;
  endpoint: string;

  constructor(name: string, apiType: ModelApiType, endpoint: string) {
    this.name = name;
    this.apiType = apiType;
    this.endpoint = endpoint;
  }
}

export class ProviderConfig {
  name: string;
  enabled: boolean;
  apiKey: string;
  enabledModels: string[];

  constructor(name: string, enabled: boolean, apiKey: string, enabledModels: string[]) {
    this.name = name;
    this.enabled = enabled;
    this.apiKey = apiKey;
    this.enabledModels = enabledModels;
  }
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  new ModelProvider("OpenAI", "OpenAI", "https://api.openai.com/v1/"),
  new ModelProvider("Claude", "Anthropic", ""),
  new ModelProvider("Gemini", "Google", ""),
  new ModelProvider("Moonshot", "OpenAI", "https://api.moonshot.cn/v1/"),
  new ModelProvider("Yi", "OpenAI", "https://api.lingyiwanwu.com/v1/"),
  new ModelProvider("Baichuan", "OpenAI", "https://api.baichuan-ai.com/v1/"),
];

export const MODELS: Model[] = [
  new Model("OpenAI", "gpt-3.5-turbo", 4 * 1024),
  new Model("OpenAI", "gpt-4", 4 * 1024),
  new Model("Anthropic", "claude-3-haiku-20240307", 128 * 1024),
  new Model("Anthropic", "claude-3-sonnet-20240229", 128 * 1024),
  new Model("Anthropic", "claude-3-opus-20240229", 128 * 1024),
  new Model("Google", "gemini-pro", 8 * 1024),
  new Model("Moonshot", "moonshot-v1-8k", 8 * 1024),
  new Model("Moonshot", "moonshot-v1-32k", 32 * 1024),
  new Model("Yi", "yi-34b-chat-0205", 4 * 1024),
  new Model("Yi", "yi-34b-chat-200k", 128 * 1024),
  new Model("Baichuan", "Baichuan2-Turbo", 4 * 1024),
];
