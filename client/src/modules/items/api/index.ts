import { apiClient } from '@/api';
import { endpoints } from '@/config';
import { Item, CreateItemDto, UpdateItemDto, ItemFilters } from '../types';
import { PaginatedResponse } from '@/shared/types';

export const itemsApi = {
  getAll: async (page = 1, limit = 10, filters?: ItemFilters) => {
    return apiClient.get<PaginatedResponse<Item>>(endpoints.items.base, {
      params: { page, limit, ...filters },
    });
  },

  getById: async (id: string) => {
    return apiClient.get<Item>(endpoints.items.byId(id));
  },

  create: async (data: CreateItemDto) => {
    return apiClient.post<Item>(endpoints.items.base, data);
  },

  update: async (id: string, data: UpdateItemDto) => {
    return apiClient.put<Item>(endpoints.items.byId(id), data);
  },

  delete: async (id: string) => {
    return apiClient.delete(endpoints.items.byId(id));
  },
};

export default itemsApi;
