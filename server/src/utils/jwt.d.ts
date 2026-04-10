export type AccessTokenPayload = {
    id: number;
    role: string;
};
export type RefreshTokenPayload = {
    id: number;
    tokenVersion: number;
};
export declare const generateAccessToken: (payload: AccessTokenPayload) => string;
export declare const generateRefreshToken: (payload: RefreshTokenPayload) => string;
export declare const verifyAccessToken: (token: string) => AccessTokenPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
//# sourceMappingURL=jwt.d.ts.map