import chalk from "chalk";
import { Command } from "commander";
import signalePkg from "signale";
import {
  findDuplicate,
  getSharedWords,
  highlightWords,
  normalizeWords,
  SeenEntry,
} from "../duplicates/helpers";
import { parsePoFile, resolvePoFiles } from "../utils/resolvers";

const { Signale } = signalePkg;

const signale = new Signale({
  scope: "tpo:duplicates",
  types: {
    start: { badge: "🔎", color: "blue", label: "search" },
    success: { badge: "✅", color: "green", label: "done" },
    info: { badge: "ℹ️", color: "cyan", label: "info" },
    warn: { badge: "⚠️", color: "yellow", label: "warn" },
    error: { badge: "❌", color: "red", label: "error" },
  },
});

export const registerDuplicatesCommand = (program: Command) => {
  program
    .command("duplicates")
    .option("--words <number>", "Minimum consecutive words to match")
    .option(
      "--similarity <number>",
      "Allow gaps inside consecutive matching (only with --words)"
    )
    .option("--only <lang>", "Only check a specific language")
    .option("--strict", "Fail with non-zero exit code if duplicates found")
    .description("Detect duplicate msgstr entries inside each language file")
    .action(async (opts) => {
      const wordsRequired = opts.words ? parseInt(opts.words, 10) : null;
      const similarity = opts.similarity ? parseInt(opts.similarity, 10) : 0;

      if (
        wordsRequired !== null &&
        (isNaN(wordsRequired) || wordsRequired < 1)
      ) {
        signale.error("Invalid value for --words. Must be >= 1.");
        process.exit(1);
      }
      if (similarity < 0) {
        signale.error("Invalid value for --similarity. Must be >= 0.");
        process.exit(1);
      }
      if (similarity > 0 && wordsRequired === null) {
        signale.error("--similarity can only be used together with --words.");
        process.exit(1);
      }

      if (wordsRequired === null) {
        signale.start("📊 Scanning msgstr duplicates with strict full match");
      } else {
        signale.start(
          `📊 Scanning msgstr duplicates: words=${wordsRequired}, similarity=${similarity}`
        );
      }

      const files = await resolvePoFiles();
      const filteredFiles = opts.only
        ? Object.entries(files).filter(([lang]) => lang === opts.only)
        : Object.entries(files);

      if (filteredFiles.length === 0) {
        signale.error(`No files found for language: ${opts.only}`);
        process.exit(1);
      }

      let totalFound = 0;

      for (const [lang, filePath] of filteredFiles) {
        const entries = await parsePoFile(filePath);
        const seen: SeenEntry[] = [];
        const duplicates: { items: SeenEntry[] }[] = [];

        for (const entry of entries) {
          const cleaned = entry.msgstr.trim();
          if (!cleaned) continue;

          const words = normalizeWords(cleaned);
          const existing = findDuplicate(
            words,
            seen,
            wordsRequired,
            similarity
          );

          if (existing) {
            const group = duplicates.find((d) => d.items.includes(existing));
            group?.items.push({
              words,
              raw: entry.msgstr,
              file: filePath,
              reference: entry.reference,
            });
          } else {
            const newEntry: SeenEntry = {
              words,
              raw: entry.msgstr,
              file: filePath,
              reference: entry.reference,
            };
            seen.push(newEntry);
            duplicates.push({ items: [newEntry] });
          }
        }

        const filtered = duplicates.filter((d) => d.items.length > 1);
        if (filtered.length === 0) {
          signale.success(`[${lang}] No duplicates found 🎉`);
          continue;
        }

        totalFound += filtered.length;
        console.log(chalk.bold(`\n🌍 Language: ${chalk.cyan(lang)}\n`));
        console.log(
          `-----------------------------------------------------------\n`
        );
        signale.warn(`❗ Found ${filtered.length} duplicate groups\n\n`);
        console.log(
          `--- Detailed Matches --------------------------------------\n`
        );

        filtered.forEach((group, idx) => {
          signale.info(`${idx + 1}. Duplicate (${group.items.length})`);
          const sharedWords = getSharedWords(group.items);
          group.items.forEach((item) => {
            const highlighted = highlightWords(item.raw, sharedWords);
            const location = item.reference
              ? `${item.file}:${item.reference.split(":")[1] ?? "?"}`
              : item.file;
            signale.info(`${highlighted}  ${chalk.gray(location)}`);
          });
          console.log();
        });
      }

      if (totalFound === 0) {
        signale.success("🎉 No duplicates found in any language");
        process.exit(0);
      } else {
        console.log(
          `-----------------------------------------------------------\n`
        );
        if (opts.strict) {
          signale.error("❌ Failing due to duplicates found (strict mode)");
          process.exit(1);
        } else {
          signale.success(
            `✅ Duplicate scan completed — total: ${totalFound} group(s) found`
          );
          process.exit(0);
        }
      }
    });
};
