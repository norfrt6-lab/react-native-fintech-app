export interface Holding {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  costBasis: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation: number;
  priceChangePercentage24h: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  holdings: Holding[];
  lastUpdated: string;
}

export interface PortfolioHistoryPoint {
  timestamp: number;
  value: number;
}

export type PortfolioTimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
