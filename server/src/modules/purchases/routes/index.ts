import { Router } from 'express';

export const purchasesRouter = Router();

purchasesRouter.get('/orders', (req, res) => {
  res.json({ success: true, data: [], message: 'Purchase orders endpoint' });
});

purchasesRouter.get('/bills', (req, res) => {
  res.json({ success: true, data: [], message: 'Bills endpoint' });
});

purchasesRouter.get('/vendor-credits', (req, res) => {
  res.json({ success: true, data: [], message: 'Vendor credits endpoint' });
});

export default purchasesRouter;
