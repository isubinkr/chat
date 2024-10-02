import jwt from "jsonwebtoken";
import { getSockets } from "../lib/helper.js";

const generateToken = (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return token;
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

export { generateToken, emitEvent };
