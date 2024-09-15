import { User } from "../models/user.model.js";

// create a new user and save it to the db and save in cookie
const newUser = (req, res) => {
  // await User.create({});

  res.send("Hello World");
};

const login = (req, res) => {
  res.send("Hello World");
};

export { login, newUser };
