export const LLM_MODELS = ["OpenAI", "Claude", "Gemini", "Kimi", "Yi", "Baichuan"];

export type Language = "en" | "zh";

export const WA_MENU_TASK_SUMMARIZE_PAGE = "summarize_page";
export const WA_MENU_TASK_EXPLAIN_SELECTION = "explain_selection";

export const WA_MESSAGE_TYPE_MENU_TASK = "web_assistant_new_task";
export const WA_MESSAGE_TYPE_OPEN = "web_assistant_open";

export const WA_MENU_OPEN = "web_assistant_open";
export const WA_MENU_SUMMARIZE_PAGE = "web_assistant_summarize_page";
export const WA_MENU_EXPLAIN_SELECTION = "web_assistant_explain_selection";

export type ChatReferenceType = "all" | "page" | "selection";

export class ChatTask {
  prompt: string;
  reference_type: ChatReferenceType;

  constructor(prompt: string, reference_type: ChatReferenceType) {
    this.prompt = prompt;
    this.reference_type = reference_type;
  }
}
