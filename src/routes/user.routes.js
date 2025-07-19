import { Router } from "express";
import { loginUser, logoutUser, refreshaccessToken, registerUser } from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([ //this middleware gives us req.files read more about this
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes: routes which run in login condition
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshaccessToken)

export default router