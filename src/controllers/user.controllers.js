import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



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
  const coverImageLocalPath = req.files?.coverImage[0]?.path;


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

  const createdUser = await User.findById(user._id).select( //mongodb automatically adds _id field with ebery entry in db
    //select by default selects all the fields so we have to remove the undesired fields from the object as done below
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

})

export { registerUser }