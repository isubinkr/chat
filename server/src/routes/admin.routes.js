import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  getAdminDetails,
  getAllChats,
  getAllMessages,
  getAllUsers,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/verify")
  .post(adminLoginValidator(), validateHandler, adminLogin);

router.route("/logout").get(adminLogout);

// only admin can access the below routes
router.use(adminOnly);

router.route("/").get(getAdminDetails);

router.route("/users").get(getAllUsers);
router.route("/chats").get(getAllChats);
router.route("/messages").get(getAllMessages);
router.route("/stats").get(getDashboardStats);

export default router;
