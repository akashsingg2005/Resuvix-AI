import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.MONGO_URI);

    logger.success(
      `MongoDB Connected : ${connection.connection.host}`
    );
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

export default connectDB;