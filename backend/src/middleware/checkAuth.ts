import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

export interface RequestWithUser extends Request {
    user?: any;
}

export const checkAuth = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
      
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      
      let user;
      if (decoded.uid) {
        user = await UserModel.findById(decoded.uid);
      } else if (decoded.email) {
        user = await UserModel.findByEmail(decoded.email);
      } else {
        return res.status(401).json({ message: "Invalid token format" });
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    } else {
      return res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }
};
