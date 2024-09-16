import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMembers,
  createGroupChat,
  getAllChats,
  getAllUserCreatedGroups,
} from "../controllers/chat.controller.js";

const router = Router();

// secured routes
router.route("/create-gc").post(verifyJWT, createGroupChat);
router.route("/allchats").get(verifyJWT, getAllChats);
router.route("/allucgroups").get(verifyJWT, getAllUserCreatedGroups);
router.route("/add-members").put(verifyJWT, addMembers);

export default router;
