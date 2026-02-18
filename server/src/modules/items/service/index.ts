import { ItemsRepository } from '../repository';
import { NotFoundError } from '../../../middleware';

export interface CreateItemDto {
  name: string;
  description?: string;
  type: 'goods' | 'service';
  sku?: string;
  hsnSac?: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice: number;
  taxRate?: number;
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
  isActive?: boolean;
}

export class ItemsService {
  private repository: ItemsRepository;

  constructor() {
    this.repository = new ItemsRepository();
  }

  async findAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const offset = (page - 1) * limit;
    const { items, total } = await this.repository.findAll(limit, offset, filters);
    
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundError('Item');
    }
    return item;
  }

  async create(data: CreateItemDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateItemDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item');
    }
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Item');
    }
    return this.repository.delete(id);
  }
}

export default ItemsService;
