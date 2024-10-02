import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  const response = {
    success: false,
    message: err.message,
    errors: err,
  };

  if (err instanceof ApiError) {
    const formattedErrors = err.errors.map((error) => ({
      message: error.message, // Extract error message
      // stack: error.stack, // Optionally include stack trace (can remove in production)
    }));
    response.errors = formattedErrors;
  }

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    response.message = `Duplicate field - ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    response.message = `Invalid format of ${errorPath}`;
    err.statusCode = 400;
  }

  return res.status(err.statusCode).json(response);
};

export { errorMiddleware };
