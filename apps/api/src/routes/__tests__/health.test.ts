import request from 'supertest';
import express from 'express';

const app = express();
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'OK' });
});

describe('GET /health', () => {
  it('should return 200 with status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });
});
