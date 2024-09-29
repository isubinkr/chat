import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespose.js";

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ApiError) {
    // console.log(err.errors);
    const formattedErrors = err.errors.map((error) => ({
      message: error.message, // Extract error message
      // stack: error.stack, // Optionally include stack trace (can remove in production)
    }));

    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: formattedErrors,
    });
  }

  // For non-ApiError instances, create a generic response
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export { errorMiddleware };
