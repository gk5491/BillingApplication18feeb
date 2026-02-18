import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const expensesRouter = Router();

const expensesFilePath = join(process.cwd(), 'server/data/expenses.json');

function readExpensesData() {
  if (!existsSync(expensesFilePath)) {
    return { expenses: [] };
  }
  const data = readFileSync(expensesFilePath, 'utf-8');
  return JSON.parse(data);
}

expensesRouter.get('/', (req, res) => {
  try {
    const data = readExpensesData();
    res.json({ success: true, data: data.expenses || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});

expensesRouter.get('/:id', (req, res) => {
  try {
    const data = readExpensesData();
    const expense = data.expenses.find((e: any) => e.id === req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
});

expensesRouter.post('/', (req, res) => {
  res.json({ success: true, data: req.body, message: 'Expense created' });
});

export default expensesRouter;
