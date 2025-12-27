import { UserModel } from "../models/User";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "../middleware/checkAuth";

export const GoogleLogin = async (req: Request, res: Response) => {
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
      created_at: new Date(),
    };

    const user = await UserModel.findOrCreate(userData);

    const token = jwt.sign({ uid: user.uid, email: user.email, name: user.name }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
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
    res.clearCookie('token');
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
    const { currentTime } = req.body; // new Date().toISOString() user system time
    const userid = req.user?.uid;
    const cash = 1500;

    if (!userid) {
      res.status(401).json({ message: "Unauthorized", success: false });
      return;
    }

    let user = await UserModel.findById(userid);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
      return;
    }

    const lastClaimTime = new Date(user.last_claim_date);
    const currentTimeDate = new Date(currentTime);
    const hoursSinceLastClaim =
      (currentTimeDate.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
    const CURRENT_TIMESTAMP = new Date(currentTime);

    if (hoursSinceLastClaim >= 12) {
      await UserModel.updateClaim(userid, cash, CURRENT_TIMESTAMP);
    } else {
      res
        .status(400)
        .json({ message: "You can only claim cash every 12 hours" });
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