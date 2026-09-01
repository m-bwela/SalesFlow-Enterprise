import type { Request, Response } from "express";

export function getCurrentUser(_req: Request, res: Response) {
    const user = res.locals.user;

    if (!user) {
        res.status(401).json({
            error: {
                code: 'UNAUTHENTICATED',
                message: 'Authentication required',
                requestId: res.locals.requestId,
            },
        });
        return; // Ensure the request does not proceed further
    }

    res.status(200).json({
        user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            status: user.status,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
}