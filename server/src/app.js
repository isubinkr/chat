import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./constants/config.js";

const app = express();

// CORS configuration
app.use(cors(corsOptions));
// config for data coming from json(form)
app.use(express.json({ limit: "16kb" }));
// config for accesing user's browser cookies (perform CRUD operation on it)
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";

// routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);

export { app };
