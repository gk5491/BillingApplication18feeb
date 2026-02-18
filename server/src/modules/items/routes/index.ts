import { Router } from 'express';
import { ItemsController } from '../controller';
import { authenticate } from '../../../middleware';

export const itemsRouter = Router();
const controller = new ItemsController();

itemsRouter.get('/', controller.getAll);
itemsRouter.get('/:id', controller.getById);
itemsRouter.post('/', authenticate, controller.create);
itemsRouter.put('/:id', authenticate, controller.update);
itemsRouter.delete('/:id', authenticate, controller.delete);

export default itemsRouter;
