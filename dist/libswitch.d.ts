export interface LibConfig {
    name: string;
    local: string;
    remote: string;
    alias?: string;
}
export declare class Libswitch {
    private root;
    private pkg;
    private libs;
    constructor();
    private refreshPkg;
    private validateConfig;
    isLocal(libName: string): boolean;
    getAllLibNames(): string[];
    /**
     * Programmatically edits tsconfig.json to inject or remove path aliases
     */
    syncTsconfig(): void;
    switchLib(libName: string, to: "local" | "remote"): Promise<void>;
    updateLib(libName: string): Promise<void>;
}
