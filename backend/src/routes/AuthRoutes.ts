import { Router } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";

const router = Router();

router.post("/google", async (req, res) => {
    try {
      const { access_token } = req.body;
    
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(res => res.json());

      const userData = {
        google_id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        given_name: userInfo.given_name,
      };

      const user = await UserModel.findOrCreate(userData);
    
      const token = jwt.sign({ uid: user.uid, email: user.email, name: user.name }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ user: { uid: user.uid, email: user.email, name: user.name, picture: user.picture } });
    } catch (error) {
      console.error('Error in Google auth:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });
  
  router.get("/me", async (req, res) => {
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

      res.json({ user: { uid: user.uid, email: user.email, name: user.name, picture: user.picture } });
    } catch (error) {
      console.error('Error in /me endpoint:', error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  router.post("/logout", async (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
  });
  

export default router;