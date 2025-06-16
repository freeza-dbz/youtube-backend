import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectdb from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
  path: "../.env"
});

connectdb();






/*
import dotenv from "dotenv";
dotenv.config({
  path: "../.env"
});

import express from "express";
const app = express()

  ; (async () => {
    try {
      await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
      app.on("error", (error) => {
        console.log("ERROR:", error)
        throw error
      })
      app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
      })

    } catch (error) {
      console.error("ERROR:", error)
      throw error
    }
  })()
*/
