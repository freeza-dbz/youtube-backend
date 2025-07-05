import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors" // Cross-Origin Resource Sharing

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({ limit: "16kb" })) //to take data in json format
app.use(express.urlencoded({ extended: true, limit: "16kb" })) //to take data from url format read in extended format extend controls how nested object in data are to be parsed 
app.use(express.static("public")) //will store all the assets in public folder like img, pdf, favicon
app.use(cookieParser()) //to place secure cookie in user browser using our server

//routes import

import userRouter from "./routes/user.routes.js" // when exports are in default then we can import without using {} otherwise we have to use {} in name of imports 

//routes declaration

app.use("/api/v1/users", userRouter)


export { app }