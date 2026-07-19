import { UserModel } from "../models/User";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "../middleware/checkAuth";

export const GoogleLogin = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (typeof access_token !== 'string' || access_token.length < 20) {
      return res.status(400).json({ message: 'Invalid Google access token' });
    }

    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!googleResponse.ok) {
      return res.status(401).json({ message: 'Google authentication failed' });
    }
    const userInfo = await googleResponse.json();

    if (!userInfo.sub || !userInfo.email || userInfo.email_verified !== true) {
      return res.status(401).json({ message: 'Google account email must be verified' });
    }

    const userData = {
      google_id: userInfo.sub,
      email: userInfo.email,
      name: typeof userInfo.name === 'string' && userInfo.name.trim() ? userInfo.name.trim() : userInfo.email.split('@')[0],
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      created_at: new Date(),
    };

    const user = await UserModel.findOrCreate(userData);

    const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        username: user.username,
        picture: user.picture,
        balance: user.balance,
        claimed_cash: user.claimed_cash,
        last_claim_date: user.last_claim_date,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error in Google auth:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
}

export const GetUser = async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    res.json({
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        username: user.username,
        picture: user.picture,
        balance: user.balance,
        claimed_cash: user.claimed_cash,
        last_claim_date: user.last_claim_date,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(401).json({ message: "Invalid token" });
  }
}

export const Logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({ message: "Failed to logout" });
  }
}


export const canClaimCash = async (req: RequestWithUser, res: Response) => {
  const userid = req.user?.uid;

  if (!userid) {
    res.status(401).json({ message: "Unauthorized", success: false });
    return;
  }

  const user = await UserModel.findById(userid);
  if (!user) {
    res.status(404).json({ message: "User not found", success: false });
    return;
  }

  if (
    user.last_claim_date < new Date(Date.now() - 1000 * 60 * 60 * 12)
  ) {
    res.json({ canClaim: true, last_claim_date: user.last_claim_date });
    return;
  } else {
    res.json({ canClaim: false, last_claim_date: user?.last_claim_date });
    return;
  }
};

export const ClaimCash = async (req: RequestWithUser, res: Response) => {
  try {
    const userid = req.user?.uid;
    const cash = 1500;

    if (!userid) {
      res.status(401).json({ message: "Unauthorized", success: false });
      return;
    }

    const user = await UserModel.claimCashIfEligible(userid, cash);
    if (!user) {
      res.status(400).json({ message: "You can only claim cash every 12 hours" });
      return;
    }

    res.json({
      message: "Cash claimed successfully",
      success: true,
      cash: cash,
    });
  } catch (error) {
    console.error("Error in claim cash:", error);
    res.status(500).json({ message: "Failed to claim cash" });
  }
};
