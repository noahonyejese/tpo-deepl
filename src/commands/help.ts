import { Command } from "commander";

export const registerHelpCommand = (program: Command) => {
  program
    .command("help", { isDefault: true })
    .description("Display help info")
    .action(() => {
      program.help();
    });
};
