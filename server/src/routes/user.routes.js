import { Router } from "express";
import { login, registerUser } from "../controllers/user.controller.js";
import { singleAvatar } from "../middlewares/multer.middleware.js";

const router = Router();

// router.post("/register", singleAvatar, registerUser);
router.route("/register").post(singleAvatar, registerUser);

router.route("/login").post(login);

//secured routes

export default router;
