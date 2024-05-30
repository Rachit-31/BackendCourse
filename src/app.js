import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express();


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:"16kb"})) // we can also set the limit of json file in this I have set the limit of 16kb
app.use(express.urlencoded({extended:true,limit:"16kb"})) //for handling of url
app.use(express.static("public")) //for storing static files jo hm server pr store karana chahte hai like images
app.use(cookieParser())

export default app;