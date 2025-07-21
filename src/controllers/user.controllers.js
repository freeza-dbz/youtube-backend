import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { User } from "../modules/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


//GENERATING TOKENS
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong while generating tokens")
  }
}

//REGISTERING USER
const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - for checking if fields are empty or not
  //check if user already exists: by username or avatar
  //check fro images or avatar
  //upload to cloudinary
  //create user object - create entry in db
  //remove password and refreash token filed from response
  //check for user creation 
  //return response


  // console.log(req.body);
  const { fullName, email, username, password } = req.body
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
    //here we are checking all fields by triming them and if any field is empty then condition is true and if is executed
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({ //finding user on based on username and email and study $ 
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //when coverImage[0] is not available then this chaining gives undefined rather than error which leads to error of 
  //CANNOT READ UNDEFINED or any of that type thats why we need to do this type of checking in case of avatar we cannot 
  //procced without it so normal if is enough we could have applied that if here to but no worries different types of checking GOOD LEARNING   


  let coverImageLocalPath
  //Array.isArray(req.files.coverImage checking if the array is of coverimage or something like that DO read about this
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }


  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select( //mongodb automatically adds _id field with every entry in db
    //select by default selects all the fields so we have to remove the undesired fields from the object as done below
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdUser,
        "User registered Successfully"
      )
    )

})

//LOGGING IN
const loginUser = asyncHandler(async (req, res) => {
  //req.body -> data
  //login via username or email
  //find the user
  //check password
  //generate access and refresh token
  //send cookie
  //send success response

  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
  //we have generated tokens after calling for user from database SO now we can eithe update our user or can hit another database querry 
  //this is the choice of developer completely as hitting database querry is a expensive operation updating is not so developer call

  const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = { //these are security options reda on gpt about more of these types 
    httpOnly: true,
    secure: true,

  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200, {
        user: LoggedInUser, accessToken, refreshToken // we are sending tokens here because if user is wanting to store tokens on local storage, or he just wants to save he tokens depends on requirement of the project
      },
        "User LoggedIn Successfully"
      )
    )


})

//LOGGING OUT
const logoutUser = asyncHandler(async (req, res) => {
  //here we dont have instance of user because we dont take email or username during logging out so we cannot use findone to find user as done above
  //now in vrifyJWT middleware we are adding req.user in user which now gives us the access of req.user here 

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { //mongoDB operator give the changes to be done
        refreshToken: undefined
      }
    },
    {
      new: true//updates the user
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
      200,
      {},
      "User Logged out"))


})

//Token Play
const refreshaccessToken = asyncHandler(async (req, res) => {
  const IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!IncomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request")
  }

  try {
    const decodedToken = jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token")
    }

    if (IncomingRefreshToken !== user?.refreshToken) { // comparing token from db and incoming
      throw new ApiError(401, "Refresh token expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, NewRefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", NewRefreshToken, options)
      .json(
        new ApiResponse(
          200, {
          accessToken, refreshToken: NewRefreshToken
        },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Refresh Token")
  }

})

//Change Password
const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPasword, newPassword } = req.body

  const user = User.findById(req.user?._id)// because we will run auth midddleware taht is why we have access of req.user
  const isPasswordCorrect = await user.isPasswordCorrect(oldPasword)

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Old Password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "Password changed successfully"
    )
    )


})

//Fetching current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "Current User fetched successfully"
    )
    )
})

//Updating Account Details
const updateDetails = asyncHandler(async (req, res) => {

  const { fullName, email } = req.body
  //PROFESSIONAL ADVICE if you want to update any file like coverImage or avatar do this with a new handler because if 
  //we go for a option of updating image only here then again and again text data { email and fullName } will be sended
  //every time we hit the endpoint SO there we will first use multer middleware so that we can acept files and secondly 
  //auth middleware as only loggedin user can only update files HEHEHEHE 

  if (!fullName || !email) {
    throw new ApiError(401, "All fields are required")
  }

  const user = User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true //this will save the updated user 
    })
    .select("-password")

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "User Details Updated Successfully"
    )
    )

})

//Updating Avatar
const updateAvatar = asyncHandler(async (req, res) => {

  const avatarLocalFile = req.file?.path //req.file is a option from multer not files because we are not having multiple files

  if (!avatarLocalFile) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = uploadOnCloudinary(avatarLocalFile)

  if (!avatar.url) {
    throw new ApiError(400, "Error while updating avatar on cloudinary")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user, "Avatar updated successfully"
      )
    )

})

//Updating Cover Image
const updateCoverImage = asyncHandler(async (req, res) => {

  const coverImageLocalFile = req.file?.path //req.file is a option from multer not files because we are not having multiple files

  if (!coverImageLocalFile) {
    throw new ApiError(400, "Avatar file is required")
  }

  const coverImage = uploadOnCloudinary(coverImageLocalFile)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while updating Cover Image on cloudinary")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user, "Cover Image updated successfully"
      )
    )

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshaccessToken,
  changeCurrentPassword,
  changeCurrentPassword,
  getCurrentUser,
  updateDetails,
  updateAvatar,
  updateCoverImage,

}