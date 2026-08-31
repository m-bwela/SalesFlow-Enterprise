import { randomBytes, createHash } from "node:crypto";

export function generateSessionToken():
string {
    return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token:
    string): string {
        return createHash("sha256")
        .update(token)
        .digest("hex");
    }