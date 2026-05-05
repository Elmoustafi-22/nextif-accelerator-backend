import express from "express";
import type { Application } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app: Application = express();

// Enable trust proxy for rate limiting behind reverse proxies (e.g., Render, Heroku)
app.set("trust proxy", 1);

import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use("/api/v1", routes);

app.get("/", (_req, res) => {
  res.json({
    message: "NEXTIF Ambassador API is running!",
  });
});

// Error handling
app.use(errorHandler);

export default app;
