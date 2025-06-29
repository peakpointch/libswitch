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
        this.tsconfigDev = path.isAbsolute(this.tsconfigDev)
            ? this.tsconfigDev
            : path.resolve(this.root, this.tsconfigDev);
        this.tsconfigProd = path.isAbsolute(this.tsconfigProd)
            ? this.tsconfigProd
            : path.resolve(this.root, this.tsconfigProd);
        this.validateConfig();
    }
    validateConfig() {
        for (const [key, value] of Object.entries(this)) {
            if (['pkg', 'root'].includes(key))
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
    }
    async useRemoteLib() {
        if (!this.isLocal()) {
            console.log('✅ Already using remote lib.');
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
    }
}
export const libswitch = new Libswitch();
export default libswitch;
