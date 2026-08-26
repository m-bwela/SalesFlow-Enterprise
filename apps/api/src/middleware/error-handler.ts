import type { ErrorRequestHandler } from "express";

export const errorhandler:
ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An internal server error occurred.",
        },
    });
};