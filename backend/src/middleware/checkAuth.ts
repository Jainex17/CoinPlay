import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequestWithUser extends Request {
    user?: any;
}

export const checkAuth = (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied.",
        error: "No token provided."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
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
