import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.MONGO_URI);

    logger.success(
      `MongoDB Connected : ${connection.connection.host}`
    );

    // Drop legacy restrictive unique index on orders collection if it exists
    try {
      await mongoose.connection.collection("orders").dropIndex("user_1_resume_1_paymentStatus_1");
      logger.info("Dropped legacy unique index user_1_resume_1_paymentStatus_1 on orders collection");
    } catch (idxErr) {
      // Index already dropped or does not exist, ignore
    }
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

export default connectDB;