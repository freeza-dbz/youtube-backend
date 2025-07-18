import { ApiError } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../modules/user.model";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    //mobile app sends header file during the session which is like Authorization: Bearer <token>

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    await User.findById(decodedToken?._id).select("-password -refreshToken")

})