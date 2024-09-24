import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  registerUser,
  searchUser,
} from "../controllers/user.controller.js";
import { singleAvatar } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginValidator,
  registerValidator,
  validateHandler,
} from "../lib/validators.js";

const router = Router();

// router.post("/register", singleAvatar, registerUser);
router
  .route("/register")
  .post(singleAvatar, registerValidator(), validateHandler, registerUser);

router.route("/login").post(loginValidator(), validateHandler, login);

//secured routes
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").get(verifyJWT, logout);
router.route("/search-user").get(verifyJWT, searchUser);

export default router;
