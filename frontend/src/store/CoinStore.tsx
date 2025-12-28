import { createContext, useContext, useEffect, useState } from "react";

export interface CoinCreator {
    uid: number;
    name: string;
    username: string;
    avatar: string;
}

export interface CoinType {
    name: string;
    symbol: string;
    creator: CoinCreator;
    total_supply: number;
    circulating_supply: number;
    initial_price: number;
    created_at: Date;
    updated_at: Date;
}

export interface CoinStore {
    coins: CoinType[];
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

    useEffect(() => {
        getCoins();
    }, []);

    return (
        <CoinStore.Provider value={{ coins }}>
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