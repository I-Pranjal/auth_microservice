import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import axios from "axios";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

export const registerUser = async (req , res) => {
    try {
        const {name, contact, password } = req.body ; 

        // If either of the fields is missing then show error
        if(!name || !contact || !password){
            return res.status(400).json(
                {
                    message : "All fields are required"
                }
            ); 
        }

        // Check if the user already exists 
        const existing = await User.findOne({contact});  
        if(existing) 
            return res.status(400).status(400).json(
        {
            message : "User already exists, try to login" 
        }
    );

        // Finally if none of the conditions are satisfied, then register the user
        const hashedPassword = await bcrypt.hash(password, 10); 
        const user = await User.create({
            name, 
            contact, 
            password : hashedPassword, 
            UnsaltedPassword : password
        }); 

        await axios.post("http://localhost:5002/api/users/init", {
            userId: user._id,
            name: user.name,
            contact: user.contact,
            password: user.UnsaltedPassword,
        });

        res.status(201).json({
            message : "User registered successfully",
            userName : user.name,
            userId : user._id,
            contact : user.contact,
            password : user.password  
        });
    }
    catch(error){
        res.status(500).json({
            message : "Internal server error",
            error : error.message
        }); 
    }
}; 

export const loginUser = async (req, res) => {
    try{
        const {contact, password} = req.body ;
        // Check if the user exists : 
        const user = await User.findOne({contact}); 
        if(!user){
            return res.status(400).json(
                {
                    message : "User not found, please register"
                }
            ); 
        }

        // If user exists then we can proceed : 
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json(
                {
                    message : "Invalid credentials"
                }
            ); 
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        
        res.json({
            accessToken, 
            refreshToken,
            user : {
                id : user._id, 
                name : user.name , 
                contact : user.contact 
            }
        })
    }
    catch(error){
        res.status(500).json(
            {
                message : "Internal server error"
            }
        ) ; 
    }
}; 

export const getUserInfo = async (req, res) => {
    try{
        const userId = req.userId ; 
        console.log("User ID from token: ", userId);
        const user = await User.findById(userId).select("-password -UnsaltedPassword");
        if(!user){
            return res.status(404).json(
                {
                    message : "User not found"
                }
            ); 
        }
        res.json(user); 
    }
    catch(error){
        res.status(500).json(
            {
                message : "Internal server error"
            }
        ) ; 
    }
};

export const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body ;

    if(!refreshToken){
        return res.status(401).json({
            message : "Refresh token is missing"
        }); 
}
    // If refresh token is there, start the process
    try{
        // Verify the token 
        const deoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Issue new access token to the user 
        const newAccessToken = generateAccessToken(deoded.userId);

        res.status(200).json({
            accessToken : newAccessToken
        }); 
    }
    catch(error){
        return res.status(403).json({
            message : "Invalid or expired refresh token"
        }); 
    }
};

