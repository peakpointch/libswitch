import { exec } from "child_process";
import { findUpSync } from "find-up";
import path from "path";
import fs from "fs";

export interface LibConfig {
  name: string;
  local: string;
  remote: string;
  tsconfigDev: string;
  tsconfigProd: string;
}

export class Libswitch {
  private root: string;
  private pkg: any;
  private libs: Map<string, LibConfig> = new Map();

  constructor() {
    const pkgPath = findUpSync("package.json");
    if (!pkgPath) throw new Error("Could not find package.json");

    this.root = path.dirname(pkgPath);
    this.pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    const configs: LibConfig[] = Array.isArray(this.pkg.libswitch)
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

  private validateConfig(cfg: LibConfig) {
    const keys: (keyof LibConfig)[] = [
      "name",
      "local",
      "remote",
      "tsconfigDev",
      "tsconfigProd",
    ];
    for (const key of keys) {
      if (!cfg[key])
        throw new Error(
          `Library ${cfg.name || "unknown"} missing config: ${key}`,
        );
    }
  }

  isLocal(libName: string): boolean {
    const libPath =
      this.pkg.dependencies?.[libName] ||
      this.pkg.devDependencies?.[libName] ||
      "";
    return libPath.startsWith("file:");
  }

  getAllLibNames(): string[] {
    return Array.from(this.libs.keys());
  }

  private setTsconfig(lib: LibConfig): void {
    const isLocal = this.isLocal(lib.name);
    const src = isLocal ? lib.tsconfigDev : lib.tsconfigProd;
    const dest = path.resolve(this.root, "tsconfig.json");

    // Note: If multiple libs use different tsconfigs, the last one processed wins.
    // Usually, dev-mode for any lib means we want the dev-tsconfig globally.
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  async switchLib(libName: string, to: "local" | "remote"): Promise<void> {
    const lib = this.libs.get(libName);
    if (!lib) throw new Error(`Library "${libName}" not found in config.`);

    const target = to === "local" ? lib.local : lib.remote;
    console.log(`🔄️ Switching ${libName} to ${to} (${target})...`);

    await new Promise<void>((resolve, reject) => {
      exec(`npm install ${target}`, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Reload package.json to reflect changes in isLocal()
    this.pkg = JSON.parse(
      fs.readFileSync(path.join(this.root, "package.json"), "utf-8"),
    );
    this.setTsconfig(lib);
  }
}
