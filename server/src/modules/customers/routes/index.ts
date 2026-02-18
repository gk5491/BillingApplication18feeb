import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const customersRouter = Router();

const customersFilePath = join(process.cwd(), 'server/data/customers.json');

function readCustomersData() {
  if (!existsSync(customersFilePath)) {
    return { customers: [] };
  }
  const data = readFileSync(customersFilePath, 'utf-8');
  return JSON.parse(data);
}

customersRouter.get('/', (req, res) => {
  try {
    const data = readCustomersData();
    res.json({ success: true, data: data.customers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

customersRouter.get('/:id', (req, res) => {
  try {
    const data = readCustomersData();
    const customer = data.customers.find((c: any) => c.id === req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customer' });
  }
});

customersRouter.post('/', (req, res) => {
  res.json({ success: true, data: req.body, message: 'Customer created' });
});

export default customersRouter;
