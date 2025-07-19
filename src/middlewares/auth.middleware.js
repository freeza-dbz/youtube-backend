import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../modules/user.model.js";

//here res is not being used so it can be replaced by _
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        let token = req.cookies?.accessToken;
        if (!token) {
            //mobile app sends header file during the session which is like Authorization: Bearer <token>
            const authHeader = req.header("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.replace("Bearer ", "").trim();
            }
        }

        // received token
        // console.log("verifyJWT Received token:", token);


        if (!token) {
            throw new ApiError(401, "No token provided, Unauthorized request");
        }
        if (typeof token !== "string") {
            throw new ApiError(401, "Invalid Token type, Unauthorized request");
        }
        // Check if token is a valid JWT format before verifying
        if (!token.match(/^([A-Za-z0-9-_]+\.){2}[A-Za-z0-9-_]+$/)) {
            throw new ApiError(401, "Malformed token, Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
        //this next() tells the compiler that now go to next method as this is the main work of middelware "Do something before the main method"

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }

})