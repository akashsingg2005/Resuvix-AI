import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
// import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import routes from "./routes/index.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(compression());

app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

// app.use(mongoSanitize());

app.use(hpp());

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| Rate Limiter
|--------------------------------------------------------------------------
*/

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Resuvix AI API",
    version: "v3.0.0",
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    server: "Running",
    timestamp: new Date(),
  });
});

app.get("/api/v1/test-razorpay", (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID,
  });
});

app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

app.use(notFound);

app.use(errorHandler);

export default app;