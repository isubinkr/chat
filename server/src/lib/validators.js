import { body, check, param, query, validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const validateHandler = (req, _, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  if (errors.isEmpty()) return next();
  else throw new ApiError(400, errorMessages);
};

const registerValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  check("avatar", "Please Upload Avatar").notEmpty(),
];

const loginValidator = () => [
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];

const createGroupValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2-100"),
];

const addMembersValidator = () => [
  body("chatId", "Please Enter Chat Id").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please Enter Chat Id").notEmpty(),
  body("userId", "Please Enter User Id").notEmpty(),
];

const chatIdValidator = () => [param("id", "Please Enter Chat Id").notEmpty()];

const sendAttachmentsValidator = () => [
  body("chatId", "Please Enter Chat Id").notEmpty(),
  check("files")
    .notEmpty()
    .withMessage("Please Upload Attachments")
    .isArray({ min: 1, max: 5 })
    .withMessage("Attachments must be 1-5"),
];

const renameGroupValidator = () => [
  param("id", "Please Enter Chat Id").notEmpty(),
  body("name", "Please Enter New Name").notEmpty(),
];

const sendRequestValidator = () => [
  body("userId", "Please Enter User Id").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "Please Enter Request Id").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be boolean"),
];

export {
  registerValidator,
  validateHandler,
  loginValidator,
  createGroupValidator,
  addMembersValidator,
  removeMemberValidator,
  chatIdValidator,
  sendAttachmentsValidator,
  renameGroupValidator,
  sendRequestValidator,
  acceptRequestValidator,
};
