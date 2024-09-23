import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMembers,
  createGroupChat,
  getAllChats,
  getAllUserCreatedGroups,
  leaveGroup,
  removeMember,
} from "../controllers/chat.controller.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create-gc").post(createGroupChat);
router.route("/allchats").get(getAllChats);
router.route("/allucgroups").get(getAllUserCreatedGroups);
router.route("/add-members").put(addMembers);
router.route("/remove-member").put(removeMember);
router.route("/leave/:id").delete(leaveGroup);

export default router;
