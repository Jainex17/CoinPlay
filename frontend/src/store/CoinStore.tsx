import { createContext, useContext, useEffect, useState } from "react";

export interface CoinCreator {
    uid?: number;
    name: string;
    username: string;
    avatar: string;
}

export interface CoinHolder {
    name: string;
    username: string;
    avatar: string;
    amount: number;
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
    initial_price: number;
    price_multiplier: number;
    price: number;
    marketCap: number;
    volume24h: number | null;
    change24h?: number;
    holders: CoinHolder[];
    priceHistory?: any[];
    comments?: CoinComment[];
    created_at: Date;
    updated_at: Date;
}

export interface CoinStore {
    coins: CoinType[];
    getCoinBySymbol: (symbol: string) => Promise<CoinType | null>;
    buyCoin: (amount: number, coinSymbol: string) => Promise<{ success: boolean; error?: string }>;
    sellCoin: (amount: number, coinSymbol: string) => Promise<{ success: boolean; error?: string; totalValue?: number }>;
}

const CoinStore = createContext<CoinStore | null>(null);
const backendURL = import.meta.env.VITE_BACKEND_URL + "/api" || "http://localhost:3000/api";

export const CoinStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [coins, setCoins] = useState<CoinType[]>([]);

    const getCoins = async () => {
        const response = await fetch(`${backendURL}/coin`);
        const data = await response.json();
        setCoins(data.coins);
    }

    const getCoinBySymbol = async (symbol: string): Promise<CoinType | null> => {
        try {
            const response = await fetch(`${backendURL}/coin/${symbol}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.coin;
        } catch {
            return null;
        }
    }

    const buyCoin = async (amount: number, coinSymbol: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${backendURL}/coin/buy/${coinSymbol}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount }),
                credentials: "include",
            });
            const data = await response.json();
            if (!data.success) {
                return { success: false, error: data.error };
            }
            return { success: true };
        } catch (error) {
            console.error("Error buying coin:", error);
            return { success: false, error: "Failed to buy coin" };
        }
    };

    const sellCoin = async (amount: number, coinSymbol: string): Promise<{ success: boolean; error?: string; totalValue?: number }> => {
        try {
            const response = await fetch(`${backendURL}/coin/sell/${coinSymbol}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount }),
                credentials: "include",
            });
            const data = await response.json();
            if (!data.success) {
                return { success: false, error: data.error };
            }
            return { success: true, totalValue: data.transaction?.total_cost };
        } catch (error) {
            console.error("Error selling coin:", error);
            return { success: false, error: "Failed to sell coin" };
        }
    };

    useEffect(() => {
        getCoins();
    }, []);

    return (
        <CoinStore.Provider value={{ coins, getCoinBySymbol, buyCoin, sellCoin }}>
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

