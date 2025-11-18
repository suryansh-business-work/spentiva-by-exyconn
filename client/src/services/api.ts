import axios from "axios";
import { ParsedExpense, Expense } from "../types";

const API_URL = "/api";

export const api = {
  parseExpense: async (message: string, trackerId?: string): Promise<ParsedExpense | { error: string }> => {
    const response = await axios.post(`${API_URL}/parse-expense`, { message, trackerId });
    return response.data;
  },

  createExpense: async (expense: ParsedExpense): Promise<Expense> => {
    const response = await axios.post(`${API_URL}/expenses`, expense);
    return response.data.expense;
  },

  getExpenses: async (trackerId?: string): Promise<Expense[]> => {
    const url = trackerId ? `${API_URL}/expenses?trackerId=${trackerId}` : `${API_URL}/expenses`;
    const response = await axios.get(url);
    return response.data.expenses;
  },

  getCategories: async () => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },

  updateExpense: async (id: string, expense: Partial<ParsedExpense>): Promise<Expense> => {
    const response = await axios.put(`${API_URL}/expenses/${id}`, expense);
    return response.data.expense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/expenses/${id}`);
  },

  // Tracker APIs
  getTrackers: async (): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/trackers`);
    return response.data.trackers;
  },

  getTracker: async (id: string): Promise<any> => {
    const response = await axios.get(`${API_URL}/trackers/${id}`);
    return response.data.tracker;
  },

  createTracker: async (tracker: any): Promise<any> => {
    const response = await axios.post(`${API_URL}/trackers`, tracker);
    return response.data.tracker;
  },

  updateTracker: async (id: string, tracker: any): Promise<any> => {
    const response = await axios.put(`${API_URL}/trackers/${id}`, tracker);
    return response.data.tracker;
  },

  deleteTracker: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/trackers/${id}`);
  },

  // Category APIs
  getTrackerCategories: async (trackerId: string): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/trackers/${trackerId}/categories`);
    return response.data.categories;
  },

  createTrackerCategory: async (trackerId: string, category: any): Promise<any> => {
    const response = await axios.post(`${API_URL}/trackers/${trackerId}/categories`, category);
    return response.data.category;
  },

  updateTrackerCategory: async (trackerId: string, categoryId: string, category: any): Promise<any> => {
    const response = await axios.put(`${API_URL}/trackers/${trackerId}/categories/${categoryId}`, category);
    return response.data.category;
  },

  deleteTrackerCategory: async (trackerId: string, categoryId: string): Promise<void> => {
    await axios.delete(`${API_URL}/trackers/${trackerId}/categories/${categoryId}`);
  },

  // Usage APIs
  getOverallUsage: async (): Promise<any> => {
    const response = await axios.get(`${API_URL}/usage/overall`);
    return response.data;
  },

  getTrackerUsage: async (trackerId: string): Promise<any> => {
    const response = await axios.get(`${API_URL}/usage/tracker/${trackerId}`);
    return response.data;
  },

  getTrackerLogs: async (trackerId: string, limit = 100, offset = 0): Promise<any> => {
    const response = await axios.get(`${API_URL}/usage/tracker/${trackerId}/logs`, {
      params: { limit, offset }
    });
    return response.data;
  },
};
