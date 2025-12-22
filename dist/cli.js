#!/usr/bin/env node
import { Libswitch } from "./libswitch.js";
const lib = new Libswitch();
const [, , cmd, ...targetNames] = process.argv;
async function run() {
    // If no names provided for local/remote, we throw an error per your requirement.
    const names = targetNames.length > 0
        ? targetNames
        : cmd === "status"
            ? lib.getAllLibNames()
            : [];
    if ((cmd === "local" || cmd === "remote") && names.length === 0) {
        console.error(`❌ Error: You must specify at least one library name for '${cmd}'.`);
        process.exit(1);
    }
    switch (cmd) {
        case "status":
            names.forEach((name) => {
                const mode = lib.isLocal(name) ? "dev (local)" : "prod (remote)";
                console.log(`${name.padEnd(20)} : ${mode}`);
            });
            break;
        case "local":
        case "remote":
            for (const name of names) {
                try {
                    await lib.switchLib(name, cmd);
                    console.log(`✅ ${name} is now ${cmd}.`);
                }
                catch (e) {
                    console.error(`❌ Failed to switch ${name}:`, e);
                }
            }
            break;
        default:
            console.log(`
Usage:
  libswitch status [names...]    Show status of all (or specific) libs
  libswitch local <names...>     Switch specific libs to local
  libswitch remote <names...>    Switch specific libs to remote
      `);
    }
}
run();
