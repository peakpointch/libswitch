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
        this.refreshPkg();
        const configs = Array.isArray(this.pkg.libswitch)
            ? this.pkg.libswitch
            : this.pkg.libswitch
                ? [this.pkg.libswitch]
                : [];
        configs.forEach((cfg) => {
            this.validateConfig(cfg);
            this.libs.set(cfg.name, cfg);
        });
    }
    refreshPkg() {
        this.pkg = JSON.parse(fs.readFileSync(path.join(this.root, "package.json"), "utf-8"));
    }
    validateConfig(cfg) {
        const required = ["name", "local", "remote"];
        for (const key of required) {
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
    /**
     * Programmatically edits tsconfig.json to inject or remove path aliases
     */
    syncTsconfig() {
        const tsconfigPath = path.resolve(this.root, "tsconfig.json");
        if (!fs.existsSync(tsconfigPath))
            return;
        let tsconfig;
        try {
            tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
        }
        catch (e) {
            console.error("❌ Failed to parse tsconfig.json");
            return;
        }
        tsconfig.compilerOptions = tsconfig.compilerOptions || {};
        tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {};
        this.libs.forEach((lib) => {
            if (!lib.alias)
                return;
            const aliasMain = lib.name;
            const aliasWildcard = `${lib.name}/*`;
            if (this.isLocal(lib.name)) {
                // Strip "file:" and resolve path relative to project root
                const basePath = lib.local.replace("file:", "");
                const srcPath = lib.alias || "src/index.ts";
                const wildcardPath = srcPath.replace(/index\.(ts|js)$|main\.(ts|js)$/, "*");
                // Add mappings
                tsconfig.compilerOptions.paths[aliasMain] = [`${basePath}${srcPath}`];
                tsconfig.compilerOptions.paths[aliasWildcard] = [
                    `${basePath}${wildcardPath}`,
                ];
            }
            else {
                // Cleanup mappings
                delete tsconfig.compilerOptions.paths[aliasMain];
                delete tsconfig.compilerOptions.paths[aliasWildcard];
            }
        });
        // Cleanup paths object if empty
        if (Object.keys(tsconfig.compilerOptions.paths).length === 0) {
            delete tsconfig.compilerOptions.paths;
        }
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        console.log("🔧 tsconfig.json paths synchronized.");
    }
    async switchLib(libName, to) {
        const lib = this.libs.get(libName);
        if (!lib)
            throw new Error(`Library "${libName}" not found in config.`);
        const target = to === "local" ? lib.local : lib.remote;
        console.log(`🔄️ Switching ${libName} to ${to} (${target})...`);
        await new Promise((resolve, reject) => {
            exec(`npm install ${target}`, (error) => {
                if (error)
                    return reject(error);
                resolve();
            });
        });
        this.refreshPkg();
        this.syncTsconfig();
    }
    async updateLib(libName) {
        const lib = this.libs.get(libName);
        if (!lib)
            throw new Error(`Library "${libName}" not found in config.`);
        const mode = this.isLocal(libName) ? "local" : "remote";
        const target = mode === "local" ? lib.local : lib.remote;
        console.log(`🔄 Updating ${libName} in ${mode} mode...`);
        await new Promise((resolve, reject) => {
            exec(`npm install ${target}`, (error) => {
                if (error)
                    return reject(error);
                resolve();
            });
        });
        this.refreshPkg();
        this.syncTsconfig();
    }
}
