import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Routes from './routes/Routes';
import { connectDB, checkConnection } from './config/db';
import { UserModel } from './models/User';
import { PortfolioModel } from './models/Portfolio';
import { BetsModel } from './models/Bets';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));    

app.use(express.json());
app.use(cookieParser());

const initializeDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if database connection is still active, reconnect if needed
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      console.log('Database connection failed, attempting to reconnect...');
      const reconnected = await connectDB();
      
      if (!reconnected) {
        res.status(503).json({ 
          message: "Database connection failed. Please try again later.",
          success: false 
        });
        return;
      }
    }
    
    // Uncomment these lines when you want to ensure tables exist
    // await UserModel.createTable();
    // await PortfolioModel.createTable();
    // await BetsModel.createTable();
    
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(503).json({ 
      message: "Database initialization failed. Please try again later.",
      success: false 
    });
  }
};

app.use('/api', initializeDatabase, Routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
