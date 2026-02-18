import { Router } from 'express';

export const reportsRouter = Router();

reportsRouter.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Reports endpoint' });
});

reportsRouter.get('/profit-loss', (req, res) => {
  res.json({ success: true, data: {}, message: 'Profit & Loss report endpoint' });
});

reportsRouter.get('/balance-sheet', (req, res) => {
  res.json({ success: true, data: {}, message: 'Balance Sheet report endpoint' });
});

reportsRouter.get('/cash-flow', (req, res) => {
  res.json({ success: true, data: {}, message: 'Cash Flow report endpoint' });
});

export default reportsRouter;
