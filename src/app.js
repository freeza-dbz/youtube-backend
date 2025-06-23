import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors" // Cross-Origin Resource Sharing

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true 
}))

app.use(express.json({limit: "16kb"})) //to take data in json format
app.use(express.urlencoded({extended: true, limit: "16kb"})) //to take data from url format read use of extended
app.use(express.static("public")) //will store all the assets in public folder like img, pdf, favicon
app.use(cookieParser()) //to place secure cookie in user browser using our server



export { app }