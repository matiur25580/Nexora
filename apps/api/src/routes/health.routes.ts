import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    data: {
      service: 'nexora-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      dependencies: { mongodb: database }
    }
  });
});
