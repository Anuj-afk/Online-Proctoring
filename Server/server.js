import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';

const server = express();
const port = process.env.PORT || 3000;

server.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  }),
);
server.use(express.json());

server.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

server.use('/api/auth', authRoutes);
server.use('/api/exams', examRoutes);

server.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
});

mongoose
  .connect(process.env.DB_LOCATION, {
    autoIndex: true,
  })
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
