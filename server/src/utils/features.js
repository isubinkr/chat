import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return token;
};

export { generateToken };
