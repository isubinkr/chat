import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;
export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adminhainham";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      // express app unable to connect
      console.log("ERR: ", error);
      throw error;
    });
    app.listen(port, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!! ", err);
  });
