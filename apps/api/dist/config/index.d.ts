export declare const config: {
    port: number;
    nodeEnv: string;
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: number;
        refreshExpiresIn: number;
    };
    cors: {
        origins: string[];
    };
    rateLimit: {
        api: number;
        auth: number;
    };
    logLevel: string;
};
//# sourceMappingURL=index.d.ts.map