#!/usr/bin/env node
import { program } from "commander";
import { Libswitch } from "./libswitch.js";

const lib = new Libswitch();

program
  .name("libswitch")
  .description("Switch between local and remote dependencies")
  .version("1.0.0");

// STATUS: Names are optional [names...]
program
  .command("status")
  .description("Show status of all (or specific) libs")
  .argument("[names...]", "Optional list of library names")
  .action((names: string[]) => {
    const targets = names.length > 0 ? names : lib.getAllLibNames();

    if (targets.length === 0) {
      console.log("No libraries configured in libswitch.");
      return;
    }

    targets.forEach((name) => {
      try {
        const mode = lib.isLocal(name) ? "dev (local)" : "prod (remote)";
        console.log(`${name.padEnd(20)} : ${mode}`);
      } catch (e) {
        console.error(`${name.padEnd(20)} : ❌ Not found in config`);
      }
    });
  });

// LOCAL: Names are required <names...>
program
  .command("local")
  .description("Switch specific libs to local development")
  .argument("<names...>", "List of library names to switch to local")
  .action(async (names: string[]) => {
    for (const name of names) {
      try {
        await lib.switchLib(name, "local");
        console.log(`✅ ${name} is now local.`);
      } catch (e) {
        console.error(
          `❌ Failed to switch ${name}:`,
          e instanceof Error ? e.message : e,
        );
      }
    }
    process.exit(0);
  });

// REMOTE: Names are required <names...>
program
  .command("remote")
  .description("Switch specific libs to remote package")
  .argument("<names...>", "List of library names to switch to remote")
  .action(async (names: string[]) => {
    for (const name of names) {
      try {
        await lib.switchLib(name, "remote");
        console.log(`✅ ${name} is now remote.`);
      } catch (e) {
        console.error(
          `❌ Failed to switch ${name}:`,
          e instanceof Error ? e.message : e,
        );
      }
    }
    process.exit(0);
  });

program.parse();
