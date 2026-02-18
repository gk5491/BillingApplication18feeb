export interface Item {
  id: string;
  name: string;
  description?: string;
  type: 'goods' | 'service';
  sku?: string;
  hsnSac?: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice: number;
  taxRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ItemsRepository {
  private items: Item[] = [];

  async findAll(limit: number, offset: number, filters?: Record<string, any>) {
    let filtered = [...this.items];
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    }
    
    if (filters?.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    if (typeof filters?.isActive === 'boolean') {
      filtered = filtered.filter(item => item.isActive === filters.isActive);
    }
    
    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);
    
    return { items, total };
  }

  async findById(id: string) {
    return this.items.find(item => item.id === id) || null;
  }

  async create(data: Omit<Item, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) {
    const item: Item = {
      id: Date.now().toString(),
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async update(id: string, data: Partial<Item>) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.items[index] = {
      ...this.items[index],
      ...data,
      updatedAt: new Date(),
    };
    
    return this.items[index];
  }

  async delete(id: string) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.items.splice(index, 1);
    return true;
  }
}

export default ItemsRepository;
