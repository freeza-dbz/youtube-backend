import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { User } from "../modules/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { log } from "console";



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

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

})

export { registerUser }