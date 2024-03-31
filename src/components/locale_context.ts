import { createContext } from "react";

export const LocaleContext = createContext<{ displayText: (val: string) => string } | null>(null);
