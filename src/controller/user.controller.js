import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'



// generate access and refresh token method
const generateAccessAndRefreshTokens= async(userId)=>{
    try {
        const user=await User.findById(userId)

        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken= refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating refresh and access token")
    }
}

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

    const existedUser=await User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser){
        throw new apiError(409, "User with email or username already exist")
    }

    // multer work file save kr lo and path de do
    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

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


const loginUser=asyncHandler(async(req, res)=>{
    // from request body bring data
    // username or email exist or not
    // find the  user 
    // check if user exist or not
    // password check
    // access and refresh token
    // send cookie
    // send response of successfull login

    const {email,username,password}=req.body;
    console.log("emial is ",email);

    if (!username && !email) {
        throw new apiError(400, "Username or email is required")
    }

    const user=await User.findOne({
        $or: [{username}, {email}]
    })  //ya toh email dhoodh do ya fir username

    if(!user){
        throw new apiError(400, "User does not exist");
    }

    // now checking the password
    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const logedInUser= await User.findById(user._id)
    select("-password -refreshToken")

    // send cookies
    const options={
        httpOnly:true,
        secure:true  //above 2 means that cookies can only be modified by serverr only
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: logedInUser, accessToken,
                refreshToken
            },
            "User Logged In successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    // clear cookies of user also refresh and access token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true  //above 2 means that cookies can only be modified by serverr only
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "unauthorized request")
    }
    try {
        const decodedToken= jwt.verify(  //encoded token is converted into decoded token
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
        if (!user) {
            throw new apiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken!==user?.refreshToken) {
            throw new apiError(401,"Refresh Token is expired or used")
        }
        const options= {
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newrefreshToken},
                "Access Token refreshed "
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid Password")
    }

    user.password= newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been changed successfully"))
})

const getCurrentUser= asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails= asyncHandler(async(res, req)=>{
    const {fullname, email}=req.body;

    if (!fullname || !email) {
        throw new apiError(400, "All fields are required")
    }

    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails
}