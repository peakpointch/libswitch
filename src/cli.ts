#!/usr/bin/env node
import { Libswitch } from './libswitch.js';

const lib = new Libswitch();
const cmd = process.argv[2];

switch (cmd) {
  case 'local':
    lib.useLocalLib();
    break;
  case 'remote':
    lib.useRemoteLib();
    break;
  case 'status':
    const mode = lib.isLocal() ? 'local' : 'remote';
    console.log(`Currently using ${mode} lib`);
    break;
  case 'tsconfig':
    console.log(lib.getTsconfigFile());
    break;
  default:
    console.log(`
Usage:
  libswitch local        Switch to local development lib
  libswitch remote       Switch to remote package lib
  libswitch status       Show current mode
  libswitch tsconfig     Show active tsconfig path
`);
}
