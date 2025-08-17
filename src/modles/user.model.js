import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  avatar: {
    type: String, // cloudinary url
    required: true,
  },
  coverImage: {
    type: String, // cloudinary url
  },
  watchHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, "Passwrod is required"]
  },
  refreshToken: {
    type: String
  },
}, {
  timestamps: true
})

userSchema.pre("save", async function (next) { // Encrypting password just before saving using pre for just before 
  if (this.isModified("password")) { // checking if password is modified or not
    this.password = await bcrypt.hash(this.password, 10)
    next()
  } else {
    next()
  }
})

userSchema.methods.isPasswordCorrect = async function (password) { // Checking if passwrod is in correct format by making a new method 
  return await bcrypt.compare(password, this.password)//this.password is the saved password of user and password is the pasword sent during logging in
}// returns true or false


userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName
  },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    })
}


userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    _id: this._id,
  },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    })
}

export const User = mongoose.model('User', userSchema)