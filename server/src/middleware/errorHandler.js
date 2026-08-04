import ApiResponse from "../utils/ApiResponse.js";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      err.message || "Internal Server Error"
    )
  );
};

export default errorHandler;