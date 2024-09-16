import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createGroupChat,
  getAllChats,
} from "../controllers/chat.controller.js";

const router = Router();

// secured routes
router.route("/create-gc").post(verifyJWT, createGroupChat);
router.route("/allchats").get(verifyJWT, getAllChats);

export default router;
