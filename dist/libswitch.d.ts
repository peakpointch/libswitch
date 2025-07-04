export interface LibswitchConfig {
    name: string;
    local: string;
    remote: string;
    tsconfigDev: string;
    tsconfigProd: string;
}
export declare class Libswitch implements LibswitchConfig {
    pkg: any;
    root: string;
    name: string;
    local: string;
    remote: string;
    tsconfigDev: string;
    tsconfigProd: string;
    constructor(config?: Partial<LibswitchConfig>);
    private validateConfig;
    isLocal(): boolean;
    isRemote(): boolean;
    getTsconfigFile(): string;
    useLocalLib(): Promise<void>;
    useRemoteLib(): Promise<void>;
}
export declare const libswitch: Libswitch;
export default libswitch;
