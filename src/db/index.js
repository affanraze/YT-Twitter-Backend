import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const dbConnection = async () => {
  try {
    const connectioninstance = await mongoose.connect(
      `${process.env.DB_URI}/${DB_NAME}`
    );
    console.log(
      `Mongo-db-connected !! DB-HOST: ${connectioninstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGO_DB_CONNECTION_ERROR", error);
    process.exit(1);
  }
};

export default dbConnection;
