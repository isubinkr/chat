import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMembers,
  createGroupChat,
  deleteChat,
  getAllChats,
  getAllUserCreatedGroups,
  getChatDetails,
  getMessages,
  leaveGroup,
  removeMember,
  renameGroup,
  sendAttachments,
} from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middlewares/multer.middleware.js";
import {
  addMembersValidator,
  chatIdValidator,
  createGroupValidator,
  removeMemberValidator,
  renameGroupValidator,
  sendAttachmentsValidator,
  validateHandler,
} from "../lib/validators.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/create-gc")
  .post(createGroupValidator(), validateHandler, createGroupChat);

router.route("/allchats").get(getAllChats);

router.route("/allucgroups").get(getAllUserCreatedGroups);

router
  .route("/add-members")
  .put(addMembersValidator(), validateHandler, addMembers);

router
  .route("/remove-member")
  .put(removeMemberValidator(), validateHandler, removeMember);

router
  .route("/leave/:id")
  .delete(chatIdValidator(), validateHandler, leaveGroup);

// send attachments
router
  .route("/message")
  .post(
    attachmentsMulter,
    sendAttachmentsValidator(),
    validateHandler,
    sendAttachments
  );

// get messages
router
  .route("/message/:id")
  .get(chatIdValidator(), validateHandler, getMessages);

// get chat details, rename, delete
router
  .route("/:id")
  .get(chatIdValidator(), validateHandler, getChatDetails)
  .put(renameGroupValidator(), validateHandler, renameGroup)
  .delete(chatIdValidator(), validateHandler, deleteChat);

// Make sure to place this ("/:id") route at the end, so that
// if none of the previous routes match, this route will be used as the fallback.

export default router;
