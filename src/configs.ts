import * as Deepl from "deepl-node";
import path from "path";

export interface TpoConfig {
  localesPath: string;
  mainLanguage: Deepl.SourceLanguageCode;
}

import fs from "node:fs/promises";

export const loadTpoConfig = async () => {
  const configPath = path.resolve("tpo.config.json");

  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(raw);

    if (!config?.localesPath || !config?.mainLanguage) {
      throw new Error("Missing required keys: localesPath, mainLanguage");
    }

    return config;
  } catch (error) {
    throw new Error("Failed to load tpo.config.json: " + error);
  }
};

let config: TpoConfig | null = null;

export const setTpoConfig = (c: TpoConfig): void => {
  config = c;
};

export const getTpoConfig = (): TpoConfig => {
  if (!config) {
    throw new Error("Tpo config has not been initialized.");
  }
  return config;
};
