import mongoose, { connect } from "mongoose"
import { DB_NAME } from "../constants.js"

// import dotenv from "dotenv";
// dotenv.config({
//   path: "../.env"
// });

const connectdb = async () => {
  try {
    // console.log("hehehe")
    const connectionInstance = await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`)
    console.log(`MongoDB connection established!! DB host : ${connectionInstance.connection.host}`)
  } catch (error) {
    console.log("ERROR in db connection : ", error)
    process.exit(1)
  }
} 

export default connectdb;
// connectdb();