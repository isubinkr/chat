export const sampleChats = [
  {
    avatar: ["https://www.w3schools.com/howto/img_avatar.png"],
    name: "John Doe",
    _id: "1",
    groupChat: false,
    members: ["1", "2"],
  },
  {
    avatar: ["https://www.w3schools.com/howto/img_avatar.png"],
    name: "John Boi",
    _id: "2",
    groupChat: true,
    members: ["1", "2"],
  },
];

export const sampleUsers = [
  {
    avatar: "https://www.w3schools.com/howto/img_avatar.png",
    name: "John Doe",
    _id: "1",
  },
  {
    avatar: "https://www.w3schools.com/howto/img_avatar.png",
    name: "John Boi",
    _id: "2",
  },
];

export const sampleNotifications = [
  {
    sender: {
      avatar: "https://www.w3schools.com/howto/img_avatar.png",
      name: "John Doe",
    },
    _id: "1",
  },
  {
    sender: {
      avatar: "https://www.w3schools.com/howto/img_avatar.png",
      name: "John Boi",
    },
    _id: "2",
  },
];

export const sampleMessage = [
  {
    attachments: [],
    content: "Achha message hai",
    _id: "sdfsgagagasdfa",
    sender: {
      _id: "user._id",
      name: "Chaman C",
    },
    chat: "chatId",
    createdAt: "2024-02-12T10:41:30.630Z",
  },

  {
    attachments: [
      {
        public_id: "adsad2",
        url: "https://www.w3schools.com/howto/img_avatar.png",
      },
    ],
    content: "",
    _id: "sdfsgagaafafgasdfa",
    sender: {
      _id: "sfafasfasf",
      name: "Chaman 2",
    },
    chat: "chatId",
    createdAt: "2024-08-20T10:41:30.630Z",
  },
];
