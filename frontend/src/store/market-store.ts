import { create } from 'zustand';

interface MarketState {
  prices: Record<string, any>;
  updatePrice: (token: string, data: any) => void;
  subscribedTokens: string[];
  subscribe: (token: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  prices: {},
  updatePrice: (token, data) => 
    set((state) => ({
      prices: { ...state.prices, [token]: data }
    })),
  subscribedTokens: [],
  subscribe: (token) => 
    set((state) => ({
      subscribedTokens: state.subscribedTokens.includes(token) 
        ? state.subscribedTokens 
        : [...state.subscribedTokens, token]
    })),
}));
