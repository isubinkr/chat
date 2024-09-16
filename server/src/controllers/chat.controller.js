import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitEvent } from "../utils/features.js";

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  if (members.length < 2) {
    throw new ApiError(400, "Group chat must have at least 3 members");
  }

  const allMembers = [...members, req.user];

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

  if (!members || members.length < 1)
    throw new ApiError(400, "Members not found");

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

export { createGroupChat, getAllChats, getAllUserCreatedGroups, addMembers };
