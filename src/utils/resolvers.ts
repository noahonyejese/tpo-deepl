import fg from "fast-glob";
import { readFile } from "fs/promises";
import { po as poCompiler } from "gettext-parser";
import path from "path";
import { match } from "path-to-regexp";
import { getTpoConfig } from "../configs";

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

export interface PoEntry {
  msgid: string;
  msgstr: string;
  comments?: string;
  reference?: string;
}

export const parsePoFile = async (filePath: string): Promise<PoEntry[]> => {
  const buffer = await readFile(filePath);
  const parsed = poCompiler.parse(buffer);

  const entries: PoEntry[] = [];

  Object.entries(parsed.translations).forEach(([ctx, ctxTranslations]) => {
    Object.entries(ctxTranslations).forEach(([msgid, translation]) => {
      if (msgid === "") return; // skip header

      entries.push({
        msgid: translation.msgid ?? "",
        msgstr: translation.msgstr?.[0] ?? "", // leave trimming for the duplicates logic
        comments: translation.comments?.translator ?? "",
        reference: translation.comments?.reference ?? "",
      });
    });
  });

  return entries;
};

export const extractPoLineMap = async (
  filePath: string
): Promise<Map<string, number>> => {
  const raw = await readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const msgidLineMap = new Map<string, number>();

  let collecting = false;
  let currentMsgid = "";
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("msgid ")) {
      collecting = true;
      currentMsgid = "";
      startLine = i + 1;

      const initial = line.match(/^msgid\s+"(.*)"$/);
      if (initial) currentMsgid += initial[1];
    } else if (collecting && line.startsWith('"')) {
      const continuation = line.match(/^"(.*)"$/);
      if (continuation) currentMsgid += continuation[1];
    } else if (collecting) {
      msgidLineMap.set(currentMsgid, startLine);
      collecting = false;
    }
  }

  if (collecting) {
    msgidLineMap.set(currentMsgid, startLine);
  }

  return msgidLineMap;
};

export const formatLocation = (filePath: string, line?: string | number) => {
  const relativePath = path.relative(process.cwd(), filePath);
  return line ? `${relativePath}:${line}` : relativePath;
};
