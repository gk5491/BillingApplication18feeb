import { Router } from 'express';
import { itemsRouter } from '../../modules/items/routes';
import { salesRouter } from '../../modules/sales/routes';
import { purchasesRouter } from '../../modules/purchases/routes';
import { customersRouter } from '../../modules/customers/routes';
import { vendorsRouter } from '../../modules/vendors/routes';
import { expensesRouter } from '../../modules/expenses/routes';
import { bankingRouter } from '../../modules/banking/routes';
import { reportsRouter } from '../../modules/reports/routes';
import { authRouter } from '../../modules/auth/routes';

export const apiRouter = Router();

// Mount module routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/items', itemsRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/purchases', purchasesRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/vendors', vendorsRouter);
apiRouter.use('/expenses', expensesRouter);
apiRouter.use('/banking', bankingRouter);
apiRouter.use('/reports', reportsRouter);

export default apiRouter;
