import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { ZodError } from "zod";

export const errorhandler:
ErrorRequestHandler = (error, _req, res, _next) => {

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                requestId: res.locals.requestId,
            },
        });
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: error.message,
                requestId: res.locals.requestId,
            },
        });
        return;
    }

    // Handle other types of errors here if needed

    console.error({
        requestId: res.locals.requestId,
        error,
    });
    
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An internal server error occurred.",
            requestId: res.locals.requestId,
        },
    });
};