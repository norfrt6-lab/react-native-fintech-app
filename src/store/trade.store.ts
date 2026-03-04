import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import type {
  TradeOrder,
  TradeFormData,
  Transaction,
} from '../types';

interface TradeStore {
  orders: TradeOrder[];
  transactions: Transaction[];
  formData: TradeFormData;
  isSubmitting: boolean;
  error: string | null;

  setFormData: (data: Partial<TradeFormData>) => void;
  resetForm: () => void;
  addTransaction: (transaction: Transaction) => void;
  clearError: () => void;
}

const defaultFormData: TradeFormData = {
  coinId: '',
  side: 'buy',
  type: 'market',
  amount: '',
  limitPrice: '',
  stopPrice: '',
};

export const useTradeStore = create<TradeStore>()(
  persist(
    immer((set, _get) => ({
      orders: [],
      transactions: [],
      formData: { ...defaultFormData },
      isSubmitting: false,
      error: null,

      setFormData: (data) =>
        set((state) => {
          state.formData = { ...state.formData, ...data };
        }),

      resetForm: () =>
        set((state) => {
          state.formData = { ...defaultFormData };
          state.error = null;
        }),

      addTransaction: (transaction) =>
        set((state) => {
          state.transactions.unshift(transaction);
        }),

      clearError: () =>
        set((state) => {
          state.error = null;
        }),
    })),
    {
      name: 'trade-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        orders: state.orders.slice(0, 100),
        transactions: state.transactions.slice(0, 500),
      }),
    },
  ),
);
