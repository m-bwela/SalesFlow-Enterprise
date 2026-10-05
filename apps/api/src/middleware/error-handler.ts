import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { ZodError } from "zod";

export const errorhandler:
ErrorRequestHandler = (error, _req, res, _next) => {

    if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "That file is too large. ID images can be up to 10 MB."
            : "The upload could not be processed. Check the files and try again.";
        res.status(400).json({
            error: { code: error.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "UPLOAD_ERROR", message, requestId: res.locals.requestId },
        });
        return;
    }

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