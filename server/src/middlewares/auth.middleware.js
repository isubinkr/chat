import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { adminSecretKey } from "../constants/constants.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const adminOnly = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      throw new ApiError(
        401,
        "Unauthorized request: only admin can access this route"
      );
    }

    const decodedSecretKey = jwt.verify(token, process.env.JWT_SECRET);

    const isMatched = decodedSecretKey === adminSecretKey;

    if (!isMatched) throw new ApiError(401, "Invalid Admin Token");

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Admin Token");
  }
});

export { verifyJWT, adminOnly };
