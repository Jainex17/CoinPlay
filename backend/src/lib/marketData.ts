export interface MarketQuote {
  instrumentSymbol: string;
  price: number;
  currency: string;
  asOf: Date;
  source: string;
}

/** Future market-data/MCP adapters implement this contract. */
export interface MarketDataProvider {
  getQuote(instrumentSymbol: string): Promise<MarketQuote | null>;
}
