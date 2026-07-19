import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAuthHeaders } from "../lib/auth";
import { backendURL } from "../lib/config";

export interface CoinCreator {
    uid?: number;
    name: string;
    username: string;
    avatar: string;
}

export interface CoinHolder {
    name: string;
    username: string;
    picture?: string;
    amount: number;
    total_spent: string | number;
}

export interface PriceHistoryPoint {
    price_per_token: string | number;
    created_at: string | Date;
}

export interface CoinComment {
    user: string;
    username: string;
    avatar: string;
    text: string;
    time: string;
}

export interface CoinType {
    cid: number;
    name: string;
    symbol: string;
    creator: CoinCreator;
    total_supply: number;
    circulating_supply: number;
    circulatingSupply: number;
    initial_price: number;
    price_multiplier: number;
    price: number;
    marketCap: number;
    fullyDilutedMarketCap?: number;
    volume24h: number | null;
    change24h?: number;
    holders: CoinHolder[];
    priceHistory?: PriceHistoryPoint[];
    created_at: Date;
    updated_at: Date;
    tokenReserve: number;
    baseReserve: number;
    totalLiquidity: number;
    asset_type?: "virtual_coin" | "market_asset";
    pricing_model?: "constant_product" | "reference";
    external_symbol?: string;
    data_source?: string;
    reference_price?: number;
    reference_price_updated_at?: Date;
    referenceQuoteStale?: boolean;
}

export interface CoinStore {
    coins: CoinType[];
    getCoinBySymbol: (symbol: string) => Promise<CoinType | null>;
    buyCoin: (amount: number, coinSymbol: string) => Promise<{ success: boolean; error?: string }>;
    sellCoin: (amount: number, coinSymbol: string) => Promise<{ success: boolean; error?: string; totalValue?: number }>;
    createCoin: (name: string, symbol: string) => Promise<{ success: boolean; error?: string }>;
    getCoins: () => Promise<void>;
}

const CoinStore = createContext<CoinStore | null>(null);
export const CoinStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [coins, setCoins] = useState<CoinType[]>([]);

    const getCoins = useCallback(async () => {
        try {
            const response = await fetch(`${backendURL}/coin`);
            if (!response.ok) return;
            const data = await response.json();
            if (Array.isArray(data.coins)) setCoins(data.coins);
        } catch (error) {
            console.error("Error loading market data:", error);
        }
    }, []);

    const getCoinBySymbol = useCallback(async (symbol: string): Promise<CoinType | null> => {
        try {
            const response = await fetch(`${backendURL}/coin/${symbol}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.coin;
        } catch {
            return null;
        }
    }, []);

    const buyCoin = useCallback(async (amount: number, coinSymbol: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const idempotencyKey = crypto.randomUUID();
            const response = await fetch(`${backendURL}/coin/buy/${coinSymbol}`, {
                method: "POST",
                headers: { ...getAuthHeaders(), "Idempotency-Key": idempotencyKey },
                body: JSON.stringify({ amount }),
                credentials: "include",
            });
            const data = await response.json();
            if (!data.success) {
                return { success: false, error: data.error };
            }

            getCoins();

            return { success: true };
        } catch (error) {
            console.error("Error buying coin:", error);
            return { success: false, error: "Failed to buy coin" };
        }
    }, [getCoins]);

    const sellCoin = useCallback(async (amount: number, coinSymbol: string): Promise<{ success: boolean; error?: string; totalValue?: number }> => {
        try {
            const idempotencyKey = crypto.randomUUID();
            const response = await fetch(`${backendURL}/coin/sell/${coinSymbol}`, {
                method: "POST",
                headers: { ...getAuthHeaders(), "Idempotency-Key": idempotencyKey },
                body: JSON.stringify({ amount }),
                credentials: "include",
            });
            const data = await response.json();
            if (!data.success) {
                return { success: false, error: data.error };
            }
            return { success: true, totalValue: Number(data.baseReceived ?? data.transaction?.total_cost ?? 0) };
        } catch (error) {
            console.error("Error selling coin:", error);
            return { success: false, error: "Failed to sell coin" };
        }
    }, []);

    const createCoin = useCallback(async (name: string, symbol: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${backendURL}/coin/create`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, symbol }),
                credentials: "include",
            });
            const data = await response.json();
            if (!data.coin) {
                return { success: false, error: data.error || "Failed to create coin" };
            }
            await getCoins();
            return { success: true };
        } catch (error) {
            console.error("Error creating coin:", error);
            return { success: false, error: "Failed to create coin" };
        }
    }, [getCoins]);

    useEffect(() => {
        getCoins();
    }, [getCoins]);

    return (
        <CoinStore.Provider value={{ coins, getCoinBySymbol, buyCoin, sellCoin, createCoin, getCoins }}>
            {children}
        </CoinStore.Provider>
    )
}

export const useCoinStore = () => {
    const context = useContext(CoinStore);

    if (!context) {
        throw new Error("useCoinStore must be used within a CoinStoreProvider");
    }
    return context;
}
