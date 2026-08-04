import ApiError from "../utils/ApiError.js";

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      const errors = error.errors?.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      next(
        new ApiError(
          400,
          "Validation failed",
          errors || error.message
        )
      );
    }
  };
};

export default validate;