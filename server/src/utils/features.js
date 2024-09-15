import jwt from "jsonwebtoken";

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const generateToken = (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return token;
};

export { generateToken, cookieOptions };
