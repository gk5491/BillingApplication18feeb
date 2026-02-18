import { Router } from 'express';

export const bankingRouter = Router();

bankingRouter.get('/accounts', (req, res) => {
  res.json({ success: true, data: [], message: 'Bank accounts endpoint' });
});

bankingRouter.get('/transactions', (req, res) => {
  res.json({ success: true, data: [], message: 'Transactions endpoint' });
});

export default bankingRouter;
