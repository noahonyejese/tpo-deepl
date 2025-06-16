import chalk from "chalk";
import * as Deepl from "deepl-node";
import fs from "fs";
import { po as poCompiler } from "gettext-parser";
import signale from "signale";
import { getTpoConfig } from "../configs";
import {
  extractPoLineMap,
  formatLocation,
  resolvePoFiles,
} from "../utils/resolvers";
import { initTranslator, translateBatch } from "./deepl";

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

  const mainRaw = fs.readFileSync(mainFilePath, { encoding: "utf-8" });
  const mainPo = poCompiler.parse(mainRaw);
  const mainTranslations = mainPo.translations[""] ?? {};

  const diffs: TranslationDiff[] = [];

  for (const [lang, filePath] of Object.entries(files)) {
    if (lang === config.mainLanguage) continue;

    const raw = fs.readFileSync(filePath, { encoding: "utf-8" });
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
    const poRaw = fs.readFileSync(filePath, { encoding: "utf-8" });
    const po = poCompiler.parse(poRaw);
    const translations = po.translations[""] ?? {};

    const lineMap = await extractPoLineMap(filePath);

    signale.log("");
    signale.start(`🌍  Translating language: [${diff.language}]`);

    const entries = diff.missing.filter(({ original }) => original);
    const texts = entries.map((e) => e.original);
    const translationsBatch = await translateBatch(
      texts,
      diff.language as Deepl.TargetLanguageCode,
      opts
    );

    translationsBatch.forEach((translated, i) => {
      const { msgid } = entries[i];
      translations[msgid] = {
        ...(translations[msgid] || {}),
        msgid,
        msgstr: [translated],
      };
      const preview =
        translated.length > 40 ? translated.slice(0, 40) + "..." : translated;

      const line = lineMap.get(msgid) ?? "?";
      const locationInfo = ` [${formatLocation(filePath, line)}]`;

      signale.info(chalk.gray(` • ${msgid} → ${preview}${locationInfo}`));
    });

    signale.success(
      `✅  Updated [${diff.language}] (${diff.untranslated} entries)\n`
    );

    const formatted = poCompiler.compile(po, { foldLength: 100000 });
    fs.writeFileSync(filePath, formatted, { encoding: "utf-8" });
  }
};
