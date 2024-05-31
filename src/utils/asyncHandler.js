const asyncHandler=(requestHandler)=>{
// // we can do by try catch or by USING PROMISES
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}
export default asyncHandler




// BELWO IS FOR TRY CATCH
// const asyncHandler=(func)=>()=>{}
// const asyncHandler=(func)=>async()=>{}  ek function ke baad ek async function laga diya
// BELOW IS WRAPPER FUNCTION WHICH WE WILL USE EVERY WHERE
/* const asyncHandler=(func)=>async(req,res,next)=>{
    try{
        await func(req,res,next)
    }
    catch(error){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}*/