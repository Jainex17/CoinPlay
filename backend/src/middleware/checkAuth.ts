import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserModel } from '../models/User';

export interface RequestWithUser extends Request {
    user?: User;
}

export const checkAuth = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

      if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as User;
      
      let user;
      if (decoded.uid) {
        user = await UserModel.findById(decoded.uid);
      } else if (decoded.email) {
        user = await UserModel.findByEmail(decoded.email);
      } else {
        res.status(401).json({ message: "Invalid token format" });
        return;
      }
      
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      
    req.user = user;
    
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
