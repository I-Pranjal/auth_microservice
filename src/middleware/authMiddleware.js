import jwt from "jsonwebtoken";
import User from "../models/User.js";

// export const protect = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization?.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select("-password");
//       next();
//     } catch (error) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }
//   }

//   if (!token) return res.status(401).json({ message: "No token provided" });
// };

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization  ;
  
  // Check if token is present 
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({
      message : "No token provided" 
    }); 
 }

  const token = authHeader.split(" ")[1]; 

  try{
      // Verifying the token 
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 

      // Attach user info to the request 
      req.userId = decoded.userId ; 

      next() ; 
  }catch(error){
    return res.status(401).json({
      message : "Invalid or expired token"
    }); 
  }
  
}
