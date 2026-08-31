import type { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "salesflow_session";

export const sessionCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
};