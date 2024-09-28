export const DB_NAME = "chatapp";

export const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

export const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adminhainham";
