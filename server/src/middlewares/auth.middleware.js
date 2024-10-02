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

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies.accessToken;
    // we are directly calling next() with an error instance in it ( eg- next(new ApiError()) )
    // because we haven't wrapped this socketAuth... fn inside asyncHandler so if any error arises
    // it won't pass to the error middleware so we are directly passing the control to
    // error middleware with next(err)
    if (!authToken)
      next(new ApiError(401, "Please login to access this route"));

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await User.findById(decodedData?._id);

    if (!user) return next(new ApiError(401, "Invalid access token"));

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ApiError(401, "Unauthorized"));
  }
};

export { verifyJWT, adminOnly, socketAuthenticator };
