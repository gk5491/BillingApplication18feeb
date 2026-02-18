import { itemsApi } from '../api';
import { CreateItemDto, UpdateItemDto, ItemFilters } from '../types';

export const itemsService = {
  async fetchItems(page = 1, limit = 10, filters?: ItemFilters) {
    try {
      const response = await itemsApi.getAll(page, limit, filters);
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to fetch items:', error);
      throw error;
    }
  },

  async fetchItem(id: string) {
    try {
      const response = await itemsApi.getById(id);
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to fetch item:', error);
      throw error;
    }
  },

  async createItem(data: CreateItemDto) {
    try {
      const response = await itemsApi.create(data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  },

  async updateItem(id: string, data: UpdateItemDto) {
    try {
      const response = await itemsApi.update(id, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  },

  async deleteItem(id: string) {
    try {
      await itemsApi.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  },
};

export default itemsService;
