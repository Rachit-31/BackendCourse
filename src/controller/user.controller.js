import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler( async(req,res)=>{
    //get user details from frontend
    // validation - not empty username , email; email is in correct format
    // check if user already exist or not:username , email
    // files hai ya nhi avtar and coverimage check karo compulsory
    // upload them to cloudnary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation if(created) return res

    const {fullname, email, username, password }=req.body
    console.log("request email", req.body);

    // if(fullname===""){
    //     throw new apiError(400,"Full Name is required")
    // } AISE HI IF ELSE LAGATE JAAO
    // ---------------OR--------------
    if (
        [fullname,email,username,password].some((field)=> field?.trim()==="")
    ) {
        throw new apiError(400,"All fields are required")
    }
    if(!email.includes('@')){
        throw new apiError(400,"Invalid Email address")
    }

    const existedUser=User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser){
        throw new apiError(409, "User with email or username already exist")
    }

    // multer work file save kr lo and path de do
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar file is required");
    }

    // upload on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400,"Avatar file is required");
    }

    // entry in database
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        //neeche vo cheeje hai jo nahi chahiye
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500,"Something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})
export {registerUser,}