//require('dotenv').config({path:'./env'});
import dotenv from "dotenv"
import connectDB from "./db/connectTomongoDb.js";
import app from "./app.js";

dotenv.config({
    path:'./.env'
})
app.get('/',(req,res)=>{
    res.send("hello");
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is ruuning on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed",err)
})