import app from "./app.js";
import connectDB from "./config/database.js";
import env from "./config/env.js";
import logger from "./config/logger.js";

await connectDB();


app.listen(env.PORT, () => {
  logger.success(
    `🚀 Server running on http://localhost:${env.PORT}`
  );
});