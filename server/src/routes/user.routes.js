import { Router } from "express";
import { login, newUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/new").post(newUser);

router.route("/login").post(login);

//secured routes

export default router;
