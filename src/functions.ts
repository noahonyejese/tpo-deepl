import chalk from "chalk";
import * as Deepl from "deepl-node";
import fg from "fast-glob";
import fs from "fs";
import { po as poCompiler } from "gettext-parser";
import path from "path";
import { match } from "path-to-regexp";
import signale from "signale";
import { getTpoConfig } from "./configs";
import { initTranslator, translateBatch } from "./deepl";

export const resolvePoFiles = async (): Promise<Record<string, string>> => {
  const { localesPath } = getTpoConfig();

  if (!localesPath.includes("{locale}")) {
    throw new Error('localesPath must include "{locale}"');
  }

  const extension = path.extname(localesPath);
  const baseDir = path.resolve(localesPath.split("{locale}")[0]);
  const globPattern = path.join(baseDir, "**", `*${extension}`);

  const files = await fg(globPattern, { absolute: true });

  const matcher = match(
    path
      .resolve(localesPath.replace("{locale}", ":locale"))
      .replace(/\./g, "\\."),
    { decode: decodeURIComponent }
  );

  const langMap: Record<string, string> = {};

  for (const filePath of files) {
    const result = matcher(filePath.replace(/\\/g, "/")); // Normalize path separators

    if (result !== false && typeof result.params.locale === "string") {
      langMap[result.params.locale] = filePath;
    }
  }

  return langMap;
};

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

type PoEntry = {
  msgid: string;
  msgstr?: string[];
  comments?: { reference?: string };
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

    signale.log(""); // spacing before new language
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
      signale.info(chalk.gray(` • ${msgid} → ${preview}`));
    });
    signale.success(
      `✅  Updated [${diff.language}] (${diff.untranslated} entries)\n`
    );

    const formatted = poCompiler.compile(po, { foldLength: 100000 });
    fs.writeFileSync(filePath, formatted);
  }
};
