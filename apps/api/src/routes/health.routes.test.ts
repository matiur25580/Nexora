import { describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';

describe('GET /api/v1/health', () => {
  it('returns service health and dependency state without requiring a database connection', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.data.service).toBe('nexora-api');
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.dependencies.mongodb).toBe(
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    );
  });
});
