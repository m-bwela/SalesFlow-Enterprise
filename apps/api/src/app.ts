import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { errorhandler } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import { notFound } from "./middleware/not-found.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import organizationRoutes from "./modules/organization/organization.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import territoriesRoutes from "./modules/territories/territories.routes.js";
import paymentMethodsRoutes from "./modules/payment-methods/payment-methods.routes.js";
import routeManagementRouter from "./modules/route management/route-management.routes.js";
import productsRoutes from "./modules/product-management/product-management.routes.js";
import auditLogRouter from "./modules/audit-log/audit-log.routes.js";

export const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL,
].filter(Boolean) as string[];

function isAllowedOrigin(origin: string) {
    return allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    }),
);
app.use(express.json());
app.use(requestId);
app.use(cookieParser());

app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/organization", organizationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/territories", territoriesRoutes);
app.use("/api/v1/payment-methods", paymentMethodsRoutes);
app.use("/api/v1/routes", routeManagementRouter);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/audit-logs", auditLogRouter)
app.use(notFound);
app.use(errorhandler);
