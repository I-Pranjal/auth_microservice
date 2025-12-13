import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name  : { type : String , required : true}, 
        contact : { type : String , required : true , unique : true },
        password : { type : String , required : true },
        UnsaltedPassword : { type : String , required : true }
    }, 
    {timestamps : true }
 ) ; 

export default mongoose.model("AuthUser", userSchema, "auth_users");


