import { BaseEntity } from '@/shared/types';

export interface Item extends BaseEntity {
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
}

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

export interface ItemFilters {
  search?: string;
  type?: 'goods' | 'service';
  isActive?: boolean;
}
