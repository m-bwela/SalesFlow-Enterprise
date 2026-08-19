import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { notFound } from "./middleware/not-found.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use(notFound);
