import { exec } from "child_process";
import { findUpSync } from "find-up";
import path from "path";
import fs from "fs";
export class Libswitch {
    constructor() {
        this.libs = new Map();
        const pkgPath = findUpSync("package.json");
        if (!pkgPath)
            throw new Error("Could not find package.json");
        this.root = path.dirname(pkgPath);
        this.pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const configs = Array.isArray(this.pkg.libswitch)
            ? this.pkg.libswitch
            : this.pkg.libswitch
                ? [this.pkg.libswitch]
                : [];
        configs.forEach((cfg) => {
            this.validateConfig(cfg);
            this.libs.set(cfg.name, {
                ...cfg,
                tsconfigDev: path.resolve(this.root, cfg.tsconfigDev),
                tsconfigProd: path.resolve(this.root, cfg.tsconfigProd),
            });
        });
    }
    validateConfig(cfg) {
        const keys = [
            "name",
            "local",
            "remote",
            "tsconfigDev",
            "tsconfigProd",
        ];
        for (const key of keys) {
            if (!cfg[key])
                throw new Error(`Library ${cfg.name || "unknown"} missing config: ${key}`);
        }
    }
    isLocal(libName) {
        const libPath = this.pkg.dependencies?.[libName] ||
            this.pkg.devDependencies?.[libName] ||
            "";
        return libPath.startsWith("file:");
    }
    getAllLibNames() {
        return Array.from(this.libs.keys());
    }
    setTsconfig(lib) {
        const isLocal = this.isLocal(lib.name);
        const src = isLocal ? lib.tsconfigDev : lib.tsconfigProd;
        const dest = path.resolve(this.root, "tsconfig.json");
        // Note: If multiple libs use different tsconfigs, the last one processed wins.
        // Usually, dev-mode for any lib means we want the dev-tsconfig globally.
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    }
    async switchLib(libName, to) {
        const lib = this.libs.get(libName);
        if (!lib)
            throw new Error(`Library "${libName}" not found in config.`);
        const target = to === "local" ? lib.local : lib.remote;
        console.log(`🔄️ Switching ${libName} to ${to} (${target})...`);
        await new Promise((resolve, reject) => {
            exec(`npm install ${target}`, (error, stdout, stderr) => {
                if (error)
                    return reject(error);
                resolve();
            });
        });
        // Reload package.json to reflect changes in isLocal()
        this.pkg = JSON.parse(fs.readFileSync(path.join(this.root, "package.json"), "utf-8"));
        this.setTsconfig(lib);
    }
    async updateLib(libName) {
        const lib = this.libs.get(libName);
        if (!lib)
            throw new Error(`Library "${libName}" not found in config.`);
        const currentlyLocal = this.isLocal(libName);
        const mode = currentlyLocal ? "local" : "remote";
        const target = currentlyLocal ? lib.local : lib.remote;
        console.log(`🔄 Updating ${libName} in ${mode} mode (${target})...`);
        await new Promise((resolve, reject) => {
            exec(`npm install ${target}`, (error) => {
                if (error)
                    return reject(error);
                resolve();
            });
        });
        // Refresh internal pkg state
        this.pkg = JSON.parse(fs.readFileSync(path.join(this.root, "package.json"), "utf-8"));
        // Ensure tsconfig is still synced correctly
        this.setTsconfig(lib);
    }
}
