import "dotenv/config";
import ConnectDB from "./db/index.js";
import { app } from "./app.js";

ConnectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Express failed to start", error);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙ Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
  });

  
