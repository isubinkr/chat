import {
  ALERT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFilesFromCloudinaray,
  uploadFilesToCloudinary,
} from "../utils/cloudinary.js";
import { emitEvent } from "../utils/features.js";

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  const allMembers = [...members, req.user._id];

  await Chat.create({
    name,
    groupChat: true,
    creator: req.user._id,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Group chat created successfully"));
});

const getAllChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ members: req.user._id }).populate(
    "members",
    "name avatar"
  );

  const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherMember(members, req.user._id);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user._id.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, transformedChats, "All chats fetched successfully")
    );
});

const getAllUserCreatedGroups = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    members: req.user._id,
    groupChat: true,
    creator: req.user._id,
  }).populate("members", "name avatar");

  const groups = chats.map(({ members, _id, groupChat, name }) => ({
    _id,
    groupChat,
    name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        groups,
        "All user created groups fetched successfully"
      )
    );
});

const addMembers = asyncHandler(async (req, res) => {
  const { chatId, members } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (!chat.groupChat) throw new ApiError(400, "Not a group chat");

  if (chat.creator.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not allowed to add member");

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100)
    throw new ApiError(400, "Group members limit reached");

  await chat.save();

  const allUsersName = allNewMembers.map((i) => i.name).join(", ");

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUsersName} has been added in the group`
  );

  emitEvent(req, REFETCH_CHATS, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Members added successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { userId, chatId } = req.body;

  const [chat, userToBeRemoved] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (!chat.groupChat) throw new ApiError(400, "Not a group chat");

  if (chat.creator.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not allowed to remove member");

  if (chat.members.length <= 3)
    throw new ApiError(400, "Group must've at least 3 members");

  const allChatMembers = chat.members.map((i) => i.toString());

  chat.members = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );

  await chat.save();

  emitEvent(req, ALERT, chat.members, {
    chatId,
    message: `${userToBeRemoved.name} has been removed from the group`,
  });

  emitEvent(req, REFETCH_CHATS, allChatMembers);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed successfully"));
});

const leaveGroup = asyncHandler(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (!chat.groupChat) throw new ApiError(400, "Not a group chat");

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== req.user._id.toString()
  );

  if (remainingMembers.length < 3) {
    throw new ApiError(400, "Group must've at least 3 members");
  }

  if (chat.creator.toString() === req.user._id.toString()) {
    const randomElement = Math.floor(Math.random() * remainingMembers.length);
    const newCreator = remainingMembers[randomElement];
    chat.creator = newCreator;
  }

  chat.members = remainingMembers;

  await chat.save();

  emitEvent(req, ALERT, chat.members, {
    chatId,
    message: `User ${req.user.name} has left the group`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left group, successfully"));
});

const sendAttachments = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  const files = req.files || [];

  if (files.length < 1) return new ApiError(400, "Please provide attachments");

  if (files.length > 5) return new ApiError(400, "Max 5 files allowed");

  const [chat, user] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user._id, "name"),
  ]);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (files.length < 1) throw new ApiError(400, "Please provide attachments");

  // Upload files here
  const attachments = await uploadFilesToCloudinary(files);

  const messageForDB = {
    content: "",
    attachments,
    sender: user._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDB,
    sender: {
      _id: user._id,
      name: user.name,
    },
  };

  const message = await Message.create(messageForDB);

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Attachments sent successfully"));
});

const getChatDetails = asyncHandler(async (req, res) => {
  if (req.query.populate === "true") {
    const chat = await Chat.findById(req.params.id)
      .populate("members", "name avatar")
      .lean();

    if (!chat) throw new ApiError(404, "Chat not found");

    chat.members = chat.members.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(200, chat, "Chat fetched successfully (with populate)")
      );
  } else {
    const chat = await Chat.findById(req.params.id);

    if (!chat) throw new ApiError(404, "Chat not found");

    return res
      .status(200)
      .json(new ApiResponse(200, chat, "Chat fetched successfully"));
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const { name } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (!chat.groupChat) throw new ApiError(403, "Not a group chat");

  if (chat.creator.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not allowed to rename the group");

  chat.name = name;

  await chat.save();

  emitEvent(req, REFETCH_CHATS, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Group renamed successfully"));
});

const deleteChat = asyncHandler(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  const members = chat.members;

  if (!chat) throw new ApiError(404, "Chat not found");

  if (chat.groupChat && chat.creator.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not allowed to delete the group");

  if (!chat.groupChat && !chat.members.includes(req.user._id.toString()))
    throw new ApiError(403, "Not allowed - not a member of this group");

  // delete all messages as well as attachments or files from cloudinary

  const messagesWithAttachment = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const publicIds = [];

  messagesWithAttachment.forEach(({ attachments }) => {
    attachments.forEach(({ publicId }) => {
      publicIds.push(publicId);
    });
  });

  await Promise.all([
    deleteFilesFromCloudinaray(publicIds),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chat deleted successfully"));
});

const getMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;

  const resultPerPage = 20;
  const skip = (page - 1) * resultPerPage;

  const chat = await Chat.findById(chatId);

  if (!chat) throw new ApiError(404, "Chat not found");

  if (!chat.members.includes(req.user._id.toString()))
    throw new ApiError(403, "Not allowed");

  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(resultPerPage)
      .populate("sender", "name")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessagesCount / resultPerPage) || 0;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messages: messages.reverse(), totalPages },
        "Fetched messages successfully"
      )
    );
});

export {
  createGroupChat,
  getAllChats,
  getAllUserCreatedGroups,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
};
