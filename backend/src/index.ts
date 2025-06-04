import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Routes from './routes/Routes';
import { connectDB } from './config/db';
import { UserModel } from './models/User';
import { PortfolioModel } from './models/Portfolio';
import { BetsModel } from './models/Bets';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('working');
});

const initializeDatabase = async () => {
  await connectDB();
  // await UserModel.createTable();
  // await PortfolioModel.createTable();
  // await BetsModel.createTable();
};

initializeDatabase();

app.use('/api', Routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
