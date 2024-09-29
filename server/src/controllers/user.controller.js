import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitEvent, generateToken } from "../utils/features.js";
import { ApiError } from "../utils/ApiError.js";
import { cookieOptions } from "../constants/constants.js";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";

// create a new user and save it to the db and save in cookie
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, password, bio } = req.body;

  const file = req.file;

  if (!file) throw new ApiError(400, "Avatar file is required");

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

  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) throw new ApiError(401, "Invalid user credentials");

  const accessToken = generateToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "User logged in successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Verification done"));
});

const logout = asyncHandler(async (_, res) => {
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const searchUser = asyncHandler(async (req, res) => {
  const { name = "" } = req.query;

  // finding all my chats
  const myChats = await Chat.find({ groupChat: false, members: req.user._id });

  // extracting all users from my chat, means friends or people i have chatted with
  const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats },
    name: { $regex: name, $options: "i" },
  });

  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users found successfully"));
});

const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const request = await Request.findOne({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  });

  if (request) throw new ApiError(400, "Request already sent");

  await Request.create({
    sender: req.user._id,
    receiver: userId,
  });

  emitEvent(req, NEW_REQUEST, [userId]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Request sent successfuly"));
});

const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId, accept } = req.body;

  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) throw new ApiError(404, "Request not found");

  if (request.receiver._id.toString() !== req.user._id.toString())
    throw new ApiError(401, "You are not authorized to accept this request");

  if (!accept) {
    await request.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Request rejected successfully"));
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      name: `${request.sender.name}-${request.receiver.name}`,
      members,
      groupChat: false,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { senderId: request.sender._id },
        "Request accepted successfully"
      )
    );
});

const getAllNotifications = asyncHandler(async (req, res) => {
  const requests = await Request.find({ receiver: req.user._id }).populate(
    "sender",
    "name avatar"
  );

  const allRequests = requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, allRequests, "Notifications fetched successfully")
    );
});

const getAllFriends = asyncHandler(async (req, res) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({
    members: req.user._id,
    groupChat: false,
  }).populate("members", "name avatar");

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherMember(members, req.user._id);

    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
  });

  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter(
      (friend) => !chat.members.includes(friend._id)
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          availableFriends,
          "Available friends fetched successfully"
        )
      );
  } else {
    return res
      .status(200)
      .json(new ApiResponse(200, friends, "Friends fetched successfully"));
  }
});

export {
  login,
  registerUser,
  getCurrentUser,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getAllNotifications,
  getAllFriends,
};
