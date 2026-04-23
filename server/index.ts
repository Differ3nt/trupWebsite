import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

import authRouter from './routes/auth';
import pushRouter from './routes/push';
import uploadRouter from './routes/upload';
import gpxRouter from './routes/gpx';
import searchRouter from './routes/search';
import path from 'path';
import express from 'express';

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TRUP API is running' });
});

// Serve static uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/push', pushRouter);
app.use('/api/images', uploadRouter);
app.use('/api/gpx', gpxRouter);
app.use('/api/search', searchRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
