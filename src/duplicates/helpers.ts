import chalk from "chalk";
import { arraysEqual, longestSimilarConsecutive } from "./utils";

export type SeenEntry = {
  words: string[];
  raw: string;
  file: string;
  reference?: string;
  msgid: string;
};

export const normalizeWords = (str: string): string[] => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
};

export const findDuplicate = (
  currentWords: string[],
  seen: SeenEntry[],
  wordsRequired: number | null,
  similarity: number
): SeenEntry | null => {
  for (const existing of seen) {
    if (arraysEqual(currentWords, existing.words)) {
      return existing;
    }
    if (wordsRequired !== null) {
      const longest = longestSimilarConsecutive(
        currentWords,
        existing.words,
        similarity
      );
      if (longest >= wordsRequired) {
        return existing;
      }
    }
  }
  return null;
};

export const getSharedWords = (items: SeenEntry[]): Set<string> => {
  const wordSets = items.map((item) => new Set(item.words));
  return wordSets.reduce((acc, set) => {
    return new Set([...acc].filter((word) => set.has(word)));
  });
};

export const highlightWords = (msgstr: string, shared: Set<string>): string => {
  return msgstr
    .split(/\s+/)
    .map((word) => {
      const cleaned = word.toLowerCase().replace(/[^\w]/g, "");
      return shared.has(cleaned) ? chalk.yellow(word) : chalk.white(word);
    })
    .join(" ");
};
