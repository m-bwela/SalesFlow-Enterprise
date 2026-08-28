import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
    constructor(code: string, message: string) {
        super(code, 409, message);
        this.name = "ConflictError";
    }
}