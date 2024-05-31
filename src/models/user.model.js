import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
// various hooks are available in mongoose for bycrypt and jwt so should explore that
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary url use karenge
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    }
},
{timestamps:true})



userSchema.pre("save",async function(next) {
    if(!this.isModified("password")){  // jb mein password update ya fir change krne ke liye call karu tabhi function ko execute krna
        return next()
    }
    this.password=bcrypt.hash(this.password,10)
    next()
}) //jb bhi data save ho rha ho toh pahale ye kaam krna hai means pre


userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

export const User=mongoose.model("User",userSchema)