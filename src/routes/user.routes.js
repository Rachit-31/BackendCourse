import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(
    upload.fields([
        //below is a middleware
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),   //fields multiple file accept krta hai
    registerUser
)
router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT ,logoutUser)

export default router;