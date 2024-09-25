import jwt from "jsonwebtoken";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions } from "../constants/constants.js";
import { adminSecretKey } from "../index.js";

const adminLogin = asyncHandler(async (req, res) => {
  const { secretKey } = req.body;

  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) throw new ApiError(401, "Invalid Admin Key");

  const adminToken = jwt.sign(secretKey, process.env.JWT_SECRET);

  return res
    .status(200)
    .cookie("adminToken", adminToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,
    })
    .json(
      new ApiResponse(
        200,
        {
          adminToken,
        },
        "Admin logged in successfully"
      )
    );
});

const adminLogout = asyncHandler(async (_, res) => {
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("adminToken", options)
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

const getAdminDetails = asyncHandler(async (_, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { admin: true },
        "Admin details fetched successfully"
      )
    );
});

const getAllUsers = asyncHandler(async (_, res) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, _id }) => {
      const [groups, friends] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
      ]);

      return {
        name,
        username,
        avatar: avatar.url,
        _id,
        groups,
        friends,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, transformedUsers, "Users fetched successfully"));
});

const getAllChats = asyncHandler(async (_, res) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });

      return {
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members: members.map(({ _id, name, avatar }) => ({
          _id,
          name,
          avatar: avatar.url,
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar.url || "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, transformedChats, "Chats fetched successfully"));
});

const getAllMessages = asyncHandler(async (_, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      content,
      attachments,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
      createdAt,
      chat: chat._id,
      groupChat: chat.groupChat,
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, transformedMessages, "Messages fetched successfully")
    );
});

const getDashboardStats = asyncHandler(async (_, res) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }), // Number of groups
      User.countDocuments(), // Number of users
      Message.countDocuments(), // Number of messages
      Chat.countDocuments(), // Number of chats
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliSeconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliSeconds;

    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Stats fetched successfully"));
});

export {
  adminLogin,
  adminLogout,
  getAdminDetails,
  getAllUsers,
  getAllChats,
  getAllMessages,
  getDashboardStats,
};
