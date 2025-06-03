import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/google", async (req, res) => {
    const { access_token } = req.body;
  
    const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    }).then(res => res.json());
  
    const token = jwt.sign(userInfo, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log(userInfo);
    res.json({ user: userInfo });
  });
  

export default router;