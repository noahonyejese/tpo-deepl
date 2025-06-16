import chalk from "chalk";
import * as Deepl from "deepl-node";
import fs from "fs";
import { po as poCompiler } from "gettext-parser";
import signale from "signale";
import { getTpoConfig } from "../configs";
import { resolvePoFiles } from "../utils/resolvers";
import { initTranslator, translateString } from "./deepl";
export interface MissingEntry {
  msgid: string;
  original: string;
}

export interface TranslationDiff {
  language: string;
  total: number;
  untranslated: number;
  missing: MissingEntry[];
}

export const getTranslationDiffs = async (
  files: Record<string, string>
): Promise<TranslationDiff[]> => {
  const config = getTpoConfig();
  const mainFilePath = files[config.mainLanguage];
  if (!mainFilePath) {
    throw new Error(`Main language file not found for ${config.mainLanguage}`);
  }

  const mainRaw = fs.readFileSync(mainFilePath);
  const mainPo = poCompiler.parse(mainRaw);
  const mainTranslations = mainPo.translations[""] ?? {};

  const diffs: TranslationDiff[] = [];

  for (const [lang, filePath] of Object.entries(files)) {
    if (lang === config.mainLanguage) continue;

    const raw = fs.readFileSync(filePath);
    const po = poCompiler.parse(raw);
    const translations = po.translations[""] ?? {};

    const missing: MissingEntry[] = [];
    let total = 0;

    for (const msgid in mainTranslations) {
      if (!msgid || msgid === "") continue;
      total++;

      const mainEntry = mainTranslations[msgid];
      const targetEntry = translations[msgid];

      const isMissing =
        !targetEntry ||
        !targetEntry.msgstr ||
        targetEntry.msgstr[0].trim() === "";

      if (isMissing) {
        missing.push({
          msgid,
          original: mainEntry?.msgstr?.[0] || msgid,
        });
      }
    }

    diffs.push({
      language: lang,
      total,
      untranslated: missing.length,
      missing,
    });
  }

  return diffs;
};

export const translateMissingEntries = async (
  diffs: TranslationDiff[],
  apiKey: string,
  opts?: Deepl.TranslateTextOptions
): Promise<void> => {
  initTranslator(apiKey);
  const poFiles = await resolvePoFiles();

  for (const diff of diffs) {
    if (diff.untranslated === 0) continue;

    const filePath = poFiles[diff.language];
    const poRaw = fs.readFileSync(filePath);
    const po = poCompiler.parse(poRaw);
    const translations = po.translations[""] ?? {};

    signale.log("");
    signale.start(`🌍  Translating language: [${diff.language}]`);

    for (const { msgid, original } of diff.missing) {
      if (!original || msgid === "") continue;

      const translation = await translateString(
        original,
        diff.language as any,
        opts
      );
      const cleanText = translation.replace(/\s*\n\s*/g, " ").trim();

      translations[msgid] = {
        ...(translations[msgid] || {}),
        msgid,
        msgstr: [cleanText],
      };

      const preview =
        cleanText.length > 40 ? cleanText.slice(0, 40) + "..." : cleanText;

      let locationInfo = "";
      const entry = translations[msgid];
      const reference = entry?.comments?.reference;
      if (reference) {
        const line = reference.split(":")[1] ?? "?";
        locationInfo = ` [${filePath}:${line}]`;
      }

      signale.info(chalk.gray(` • ${msgid} → ${preview}${locationInfo}`));
    }

    signale.success(
      `✅  Updated [${diff.language}] (${diff.untranslated} entries)\n`
    );

    const formatted = poCompiler.compile(po, { foldLength: 100000 });
    fs.writeFileSync(filePath, formatted);
  }
};
