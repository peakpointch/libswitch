export interface LibConfig {
    name: string;
    local: string;
    remote: string;
    tsconfigDev: string;
    tsconfigProd: string;
}
export declare class Libswitch {
    private root;
    private pkg;
    private libs;
    constructor();
    private validateConfig;
    isLocal(libName: string): boolean;
    getAllLibNames(): string[];
    private setTsconfig;
    switchLib(libName: string, to: "local" | "remote"): Promise<void>;
}
