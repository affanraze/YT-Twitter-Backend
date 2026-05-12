import "dotenv/config";
import dbConnection from "./db/index.js";
import app from "./app.js";
dbConnection()
  .then(() => {
    app.on("error", (error) => {
      console.log("Errr while listening", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening on ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("Mongo Db connection failed", err));
