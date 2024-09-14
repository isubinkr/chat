import express from "express";
import userRoute from "./routes/user.routes.js";

const app = express();

app.use("/user", userRoute);

app.get("/", (req, res) => {
  console.log("Hello World");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
