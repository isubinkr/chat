import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return token;
};

const emitEvent = (req, event, users, data) => {
  console.log("Emmiting event", event);
};

export { generateToken, emitEvent };
