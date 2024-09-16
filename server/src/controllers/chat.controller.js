import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chat.model.js";
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

export { createGroupChat, getAllChats };
