import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Routes from './routes/Routes';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('working');
});

connectDB();

app.use('/api', Routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
