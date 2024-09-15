import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions, generateToken } from "../utils/features.js";
import { ApiError } from "../utils/ApiError.js";

// create a new user and save it to the db and save in cookie
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, password, bio } = req.body;

  const avatar = {
    public_id: "Sdgdf",
    url: "asdfaf",
  };

  const user = await User.create({
    name,
    bio,
    username,
    password,
    avatar,
  });

  const accessToken = generateToken(user);

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(200, { accessToken }, "User registered successfully")
    );
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) throw new ApiError(401, "Invalid user credentials");

  const accessToken = generateToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "User logged in successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {});

export { login, registerUser, getCurrentUser };
