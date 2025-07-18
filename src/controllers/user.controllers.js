import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { User } from "../modules/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = User.findById(userId)
    const AccessToken = generateAccessToken()
    const RefreshToken = generateRefreshToken()

    user.refreshToken = RefreshToken
    await user.schemaLevelProjections({ validateBeforeSave: false })

    return { AccessToken, RefreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating Tokens")
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

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )

})
 
// LOGGING IN
const loginUser = asyncHandler(async (req, res) => {
  //req.body -> data
  //login via username or email
  //find the user
  //check password
  //generate access and refresh token
  //send cookie
  //send success response

  const { email, username, password } = req.body

  if (!username || !email) {
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

  const { AccessToken, RefreshToken } = await generateAccessandRefreshToken(user._id)
  //we have generated tokens after calling for user from database SO now we can eithe update our user or can hit another database querry 
  //this is the choice of developer completely as hitting database querry is a expensive operation updating is not so developer call

  const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = { //these are security options reda on gpt about more of these types 
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("Access Token", AccessToken, options)
  .cookie("Refresh Token", RefreshToken, options)
  .json(
    new ApiResponse(
      200,{
        user: LoggedInUser, AccessToken, RefreshToken // we are sending tokens here because if user is wanting to store tokens on local storage, or he just wants to save he tokens depends on requirement of the project
      },
      "User LoggedIn Successfully"
    )
  )


})


//LOGGING OUT
const logoutUser = asyncHandler(async(req, res) => {
  //here we dont have instance of user because we dont take email or username during logging out so we cannot use findone to find user as done above
  
})

export { registerUser, loginUser }