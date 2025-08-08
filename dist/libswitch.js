import { exec } from 'child_process';
import { findUpSync } from 'find-up';
import path from 'path';
import fs from 'fs';
export class Libswitch {
    constructor(config) {
        this.root = path.dirname(findUpSync('package.json'));
        const packageJsonPath = path.join(this.root, 'package.json');
        this.pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const pkgConfig = this.pkg.libswitch || {};
        this.name = config?.name || pkgConfig.name || '';
        this.local = config?.local || pkgConfig.local || '';
        this.remote = config?.remote || pkgConfig.remote || '';
        this.tsconfigDev = config?.tsconfigDev || pkgConfig.tsconfigDev || '';
        this.tsconfigProd = config?.tsconfigProd || pkgConfig.tsconfigProd || '';
        if (path.basename(this.tsconfigDev) === 'tsconfig.json' ||
            path.basename(this.tsconfigProd) === 'tsconfig.json') {
            throw new Error(`You cannot set the dev or prod tsconfig to "tsconfig.json" because it will be overwritten during switching. Use a ".dev.json" or ".prod.json" file instead.`);
        }
        this.tsconfigDev = path.isAbsolute(this.tsconfigDev)
            ? this.tsconfigDev
            : path.resolve(this.root, this.tsconfigDev);
        this.tsconfigProd = path.isAbsolute(this.tsconfigProd)
            ? this.tsconfigProd
            : path.resolve(this.root, this.tsconfigProd);
        this.state = this.isLocal() ? 'dev' : 'prod';
        this.validateConfig();
    }
    validateConfig() {
        for (const [key, value] of Object.entries(this)) {
            if (['pkg', 'root', 'state'].includes(key))
                continue;
            if (!value) {
                throw new Error(`Missing libswitch config key: ${key}`);
            }
        }
    }
    isLocal() {
        const libPath = this.pkg.dependencies?.[this.name] || this.pkg.devDependencies?.[this.name] || '';
        return libPath.startsWith('file:');
    }
    isRemote() {
        return !this.isLocal();
    }
    getTsconfigFile() {
        return this.isLocal() ? this.tsconfigDev : this.tsconfigProd;
    }
    setTsconfig(file) {
        let src = file;
        if (!file) {
            src = this.getTsconfigFile();
        }
        else if (!path.isAbsolute(src)) {
            src = path.resolve(this.root, file);
        }
        const dest = path.resolve(this.root, 'tsconfig.json');
        fs.copyFileSync(src, dest);
    }
    async useLocalLib() {
        if (this.isLocal()) {
            console.log('✅ Already using local lib.');
            return;
        }
        console.log('🔄️ Switching to local lib...');
        await new Promise((resolve, reject) => {
            exec(`npm install ${this.local}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                if (stdout)
                    console.log(stdout);
                if (stderr)
                    console.error(stderr);
                resolve();
            });
        });
        this.state = 'dev';
        this.setTsconfig(this.tsconfigDev);
    }
    async useRemoteLib() {
        if (!this.isLocal()) {
            console.log('✅ Already using remote lib.');
            console.log('🔄️ Updating remote lib...');
        }
        else {
            console.log('🔄️ Switching to remote lib...');
        }
        await new Promise((resolve, reject) => {
            exec(`npm install ${this.remote}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                if (stdout)
                    console.log(stdout);
                if (stderr)
                    console.error(stderr);
                resolve();
            });
        });
        this.state = 'prod';
        this.setTsconfig(this.tsconfigProd);
    }
}
export const libswitch = new Libswitch();
export default libswitch;
