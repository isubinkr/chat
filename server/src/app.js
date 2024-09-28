import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./constants/config.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

// CORS configuration
app.use(cors(corsOptions));
// config for data coming from json(form)
app.use(express.json({ limit: "16kb" }));
// config for accesing user's browser cookies (perform CRUD operation on it)
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.model.js";

// routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/admin", adminRouter);

// socket io
const userSocketIds = new Map();

// io.use((socket, next) => {});

io.on("connection", (socket) => {
  const user = {
    _id: "Asdfsdfa",
    name: "Subin",
  };

  userSocketIds.set(user._id, socket.id);

  console.log("New user connected: ", socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };

    const membersSocket = getSockets(members);

    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });

    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    userSocketIds.delete(user._id);
  });
});

export { httpServer, userSocketIds };
