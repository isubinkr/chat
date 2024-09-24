import { Router } from "express";
import {
  acceptFriendRequest,
  getAllFriends,
  getAllNotifications,
  getCurrentUser,
  login,
  logout,
  registerUser,
  searchUser,
  sendFriendRequest,
} from "../controllers/user.controller.js";
import { singleAvatar } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validateHandler,
} from "../lib/validators.js";

const router = Router();

// router.post("/register", singleAvatar, registerUser);
router
  .route("/register")
  .post(singleAvatar, registerValidator(), validateHandler, registerUser);

router.route("/login").post(loginValidator(), validateHandler, login);

//secured routes
router.use(verifyJWT);

router.route("/current-user").get(getCurrentUser);
router.route("/logout").get(logout);
router.route("/search-user").get(searchUser);

router
  .route("/send-request")
  .put(sendRequestValidator(), validateHandler, sendFriendRequest);

router
  .route("/accept-request")
  .put(acceptRequestValidator(), validateHandler, acceptFriendRequest);

router.route("/notifications").get(getAllNotifications);
router.route("/friends").get(getAllFriends);

export default router;
