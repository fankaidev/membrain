import { useEffect, useRef, useState } from "react";

export function useStorage<T>(
  areaName: "sync" | "local",
  keyInArea: string,
  defaultValue: T
): [T, (value: T) => void] {
  const key = `${areaName}:${keyInArea}`;
  const [value, setValue] = useState<T>(defaultValue);
  const valueRef = useRef(defaultValue);
  const area = areaName === "sync" ? chrome.storage.sync : chrome.storage.local;

  useEffect(() => {
    area.get([key], (result) => {
      if (result[key] && result[key] !== JSON.stringify(valueRef.current)) {
        console.debug(`init from storage ${key}=${result[key]}`);
        valueRef.current = JSON.parse(result[key]);
        setValue(valueRef.current);
      }
    });
  }, []);

  useEffect(() => {
    if (value !== valueRef.current) {
      valueRef.current = value;
      // console.debug(`set ${key} value`);
      area.set({ [key]: JSON.stringify(value) });
    }
  }, [value]);

  return [value, (value: T) => setValue(value)];
}
