#!/usr/bin/env node
import { program } from "commander";
import { Libswitch } from "./libswitch.js";
const lib = new Libswitch();
program
    .name("libswitch")
    .description("Switch between local and remote dependencies")
    .version("0.1.0");
// STATUS: Names are optional [names...]
program
    .command("status")
    .description("Show status of all (or specific) libs")
    .argument("[names...]", "Optional list of library names")
    .action((names) => {
    const targets = names.length > 0 ? names : lib.getAllLibNames();
    targets.forEach((name) => {
        const mode = lib.isLocal(name) ? "dev (local)" : "prod (remote)";
        console.log(`${name.padEnd(20)} : ${mode}`);
    });
});
// LOCAL: Names are required <names...>
program
    .command("local")
    .argument("<names...>", "Libraries to switch to local")
    .action(async (names) => {
    for (const name of names) {
        try {
            await lib.switchLib(name, "local");
        }
        catch (e) {
            console.error(`❌ ${name}:`, e);
        }
    }
    process.exit(0);
});
// REMOTE: Names are required <names...>
program
    .command("remote")
    .argument("<names...>", "Libraries to switch to remote")
    .action(async (names) => {
    for (const name of names) {
        try {
            await lib.switchLib(name, "remote");
        }
        catch (e) {
            console.error(`❌ ${name}:`, e);
        }
    }
    process.exit(0);
});
program
    .command("update")
    .argument("<names...>", "Libraries to refresh")
    .action(async (names) => {
    for (const name of names) {
        try {
            await lib.updateLib(name);
        }
        catch (e) {
            console.error(`❌ ${name}:`, e);
        }
    }
    process.exit(0);
});
program
    .command("sync")
    .description("Force sync tsconfig paths with current package.json state")
    .action(() => {
    lib.syncTsconfig();
    process.exit(0);
});
program.parse();
