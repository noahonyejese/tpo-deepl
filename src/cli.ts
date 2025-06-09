#!/usr/bin/env node
import chalk from "chalk";
import Table from "cli-table3";
import { Command } from "commander";
import dotenvFlow from "dotenv-flow";
import "dotenv/config";
import signalePkg from "signale";
import { loadTpoConfig, setTpoConfig } from "./configs";
import {
  getTranslationDiffs,
  resolvePoFiles,
  translateMissingEntries,
} from "./functions";

const { Signale } = signalePkg;

const signale = new Signale({
  scope: "tpo",
  types: {
    start: { badge: "🚀", color: "blue", label: "start" },
    success: { badge: "✅", color: "green", label: "done" },
    warn: { badge: "⚠️", color: "yellow", label: "warn" },
    error: { badge: "❌", color: "red", label: "error" },
  },
});

const program = new Command();

program
  .name("tpo")
  .description("Translate missing entries in .po files using DeepL")
  .version("1.0.4");

program
  .command("translate")
  .option("--dry-run", "Show untranslated strings but do not translate", false)
  .option(
    "--formality <level>",
    "DeepL formality level: less, more, prefer_less, prefer_more, default",
    "default"
  )
  .option("--only <lang>", "Only translate a specific language")
  .option("--silent", "Suppress output", false)
  .action(async (opts) => {
    if (opts.silent) signale.disable();

    signale.start("Starting translation");

    dotenvFlow.config();
    const config = await loadTpoConfig();
    setTpoConfig(config);

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      signale.error("Missing DEEPL_API_KEY in .env");
      process.exit(1);
    }

    const files = await resolvePoFiles();
    const diffs = await getTranslationDiffs(files);

    const filtered = opts.only
      ? diffs.filter((d) => d.language === opts.only)
      : diffs;

    if (filtered.every((d) => d.untranslated === 0)) {
      signale.success("🎉 All translations are up-to-date!");
      return;
    }

    if (!opts.silent) {
      const table = new Table({
        head: ["Language", "Total", "Untranslated"],
        style: { head: ["cyan"], border: ["grey"] },
        colWidths: [20, 10, 15],
      });

      for (const { language, total, untranslated } of filtered) {
        table.push([
          language === config.mainLanguage
            ? chalk.gray(language)
            : chalk.white(language),
          chalk.gray(String(total)),
          untranslated === 0
            ? chalk.green("✔ 0")
            : chalk.yellow(String(untranslated)),
        ]);
      }

      console.log("\n📊 Translation Summary:\n");
      console.log(table.toString());
    }

    if (opts.dryRun) {
      signale.success("Dry run complete. No translations performed.");
      return;
    }

    try {
      await translateMissingEntries(filtered, apiKey, {
        formality: opts.formality,
      });
      signale.success("Translation completed");
    } catch (err) {
      signale.error("Failed to complete translation");
      console.error(err);
    }
  });

program
  .command("help", { isDefault: true })
  .description("Display help info")
  .action(() => {
    program.help();
  });

program.parse();
