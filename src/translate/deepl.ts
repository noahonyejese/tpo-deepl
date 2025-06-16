import * as Deepl from "deepl-node";
import signale from "signale";
import { getTpoConfig } from "../configs";

let translator: Deepl.Translator | null = null;

export const initTranslator = (authKey: string): void => {
  if (!translator) {
    translator = new Deepl.Translator(authKey);
  }
};

export const translateString = async (
  text: string,
  lang: Deepl.TargetLanguageCode,
  opts?: Deepl.TranslateTextOptions
): Promise<string> => {
  const { mainLanguage } = getTpoConfig();

  if (!translator) {
    throw new Error("Translator not initialized. Call initTranslator() first.");
  }

  const safeText = text.replace(
    /\{[^}]+\}/g,
    (match) => `<keep>${match}</keep>`
  );

  try {
    const result = await translator.translateText(
      safeText,
      mainLanguage,
      lang,
      {
        tagHandling: "xml",
        ignoreTags: ["keep"],
        preserveFormatting: true,
        ...opts,
      }
    );

    return result.text.replace(/<keep>(\{[^}]+\})<\/keep>/g, "$1");
  } catch (error) {
    signale.error("Error translating text:", error);
    return "";
  }
};
