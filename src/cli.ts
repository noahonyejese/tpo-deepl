#!/usr/bin/env node
import { Command } from "commander";
import dotenvFlow from "dotenv-flow";
import "dotenv/config";
import signalePkg from "signale";
import { registerDuplicatesCommand } from "./commands/duplicates";
import { registerHelpCommand } from "./commands/help";
import { registerTranslateCommand } from "./commands/translate";
import { loadTpoConfig, setTpoConfig } from "./configs";

const { Signale } = signalePkg;

export const signale = new Signale({
  scope: "tpo",
  types: {
    start: { badge: "🚀", color: "blue", label: "start" },
    success: { badge: "✅", color: "green", label: "done" },
    warn: { badge: "⚠️", color: "yellow", label: "warn" },
    error: { badge: "❌", color: "red", label: "error" },
  },
});

async function main() {
  dotenvFlow.config();

  const config = await loadTpoConfig();
  setTpoConfig(config);

  const program = new Command();

  program
    .name("tpo")
    .description(
      "Translate missing entries in .po files using DeepL & detect po duplicates"
    )
    .version("1.2.0");

  registerTranslateCommand(program);
  registerDuplicatesCommand(program);
  registerHelpCommand(program);

  await program.parseAsync();
}

main();
