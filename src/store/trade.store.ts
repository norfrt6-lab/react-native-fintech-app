import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import { TRADE } from '../lib/constants';
import { logger } from '../lib/logger';
import { divide, percentOf, toFixed } from '../lib/decimal';
import type {
  TradeOrder,
  TradeFormData,
  Transaction,
} from '../types';

const TAG = 'TradeStore';

interface TradeStore {
  orders: TradeOrder[];
  transactions: Transaction[];
  formData: TradeFormData;
  isSubmitting: boolean;
  error: string | null;

  setFormData: (data: Partial<TradeFormData>) => void;
  resetForm: () => void;
  executeTrade: (currentPrice: number) => TradeOrder;
  addTransaction: (transaction: Transaction) => void;
  getTransactionsByCoin: (coinId: string) => Transaction[];
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
    immer((set, get) => ({
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

      executeTrade: (currentPrice) => {
        const { formData } = get();
        const amount = parseFloat(formData.amount);
        const fee = percentOf(amount, TRADE.FEE_PERCENTAGE);
        const totalAmount = formData.side === 'buy'
          ? toFixed(amount + fee, 8)
          : toFixed(amount - fee, 8);
        const quantity = divide(amount, currentPrice);
        const timestamp = new Date().toISOString();

        const order: TradeOrder = {
          id: `order_${Date.now()}`,
          coinId: formData.coinId,
          symbol: '',
          name: '',
          side: formData.side,
          type: formData.type,
          quantity,
          price: currentPrice,
          limitPrice: formData.limitPrice ? parseFloat(formData.limitPrice) : undefined,
          stopPrice: formData.stopPrice ? parseFloat(formData.stopPrice) : undefined,
          totalAmount,
          fee,
          status: 'filled',
          createdAt: timestamp,
          filledAt: timestamp,
        };

        set((state) => {
          state.orders.unshift(order);
          state.transactions.unshift({
            id: `txn_${Date.now()}`,
            type: formData.side,
            coinId: formData.coinId,
            symbol: order.symbol,
            name: order.name,
            quantity,
            price: currentPrice,
            totalAmount,
            fee,
            status: 'filled',
            createdAt: timestamp,
          });
        });

        logger.info(TAG, `Trade executed: ${formData.side} ${quantity} @ ${currentPrice}`);
        return order;
      },

      addTransaction: (transaction) =>
        set((state) => {
          state.transactions.unshift(transaction);
        }),

      getTransactionsByCoin: (coinId) =>
        get().transactions.filter((t) => t.coinId === coinId),

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
