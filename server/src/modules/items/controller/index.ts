import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../../common/responses';
import { parsePagination } from '../../../utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class ItemsController {
  private itemsFilePath = join(process.cwd(), 'server/data/items.json');

  private readItemsData() {
    if (!existsSync(this.itemsFilePath)) {
      return { items: [] };
    }
    const data = readFileSync(this.itemsFilePath, 'utf-8');
    return JSON.parse(data);
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const data = this.readItemsData();
      const items = data.items || [];
      const total = items.length;
      const offset = (page - 1) * limit;
      const paginatedItems = items.slice(offset, offset + limit);
      
      return sendPaginated(res, paginatedItems, page, limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = this.readItemsData();
      const item = data.items.find((i: any) => i.id === id);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      return sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      // TODO: Implement actual database insert
      const item = { id: '1', ...data };
      
      return sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      // TODO: Implement actual database update
      const item = { id, ...data };
      
      return sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // TODO: Implement actual database delete
      
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}

export default ItemsController;
