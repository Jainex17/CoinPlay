import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface PortfolioType {
    cash: number;
    claimed_cash: number;
    last_claim_date: Date | null;
}

export interface MostCashPlayerType {
    name: string;
    picture: string;
    cash: number;
}

export interface MostCashWageredType {
    name: string;
    picture: string;
    total_bets: number;
    total_wagered: number;
}

export interface LeaderboardType {
    MostCashPlayerData: MostCashPlayerType[];
    MostCashWageredData: MostCashWageredType[];
}

interface PortfolioStore {
    portfolio: PortfolioType;
    canClaim: boolean;
    claimCash: () => Promise<void>;
    canClaimCash: () => Promise<void>;
    getUserPortfolio: () => Promise<void>;
    getLeaderBoardData: () => Promise<void>;
    leaderboard: LeaderboardType;
    isLeaderboardLoading: boolean;
}

const PortfolioStore = createContext<PortfolioStore | null>(null);
const backendURL = import.meta.env.VITE_BACKEND_URL + "/api" || "http://localhost:3000/api";

export const usePortfolioStore = () => {
    const context = useContext(PortfolioStore);
    if (!context) {
        throw new Error("usePortfolioStore must be used within an PortfolioStoreProvider");
    }
    return context;
}

export const PortfolioStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [portfolio, setPortfolio] = useState<PortfolioType>({
        cash: 0,
        claimed_cash: 0,
        last_claim_date: null
    });
    const [leaderboard, setLeaderboard] = useState<LeaderboardType>({
        MostCashPlayerData: [],
        MostCashWageredData: []
    });
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);

    const [canClaim, setCanClaim] = useState(false);

    const canClaimCash = async () => {
        const response = await fetch(`${backendURL}/portfolio/claim`, {
            credentials: 'include'
        });
        const data = await response.json();
        setCanClaim(data.canClaim);
        setPortfolio({
            cash: data.cash,
            claimed_cash: data.claimed_cash,
            last_claim_date: data.last_claim_date
        });
    }

    const claimCash = async () => {
        const response = await fetch(`${backendURL}/portfolio/claim`, {
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify({
                currentTime: new Date().toISOString()
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            setPortfolio({
                cash: data.cash,
                claimed_cash: data.claimed_cash,
                last_claim_date: data.last_claim_date
            });
            toast.success("Cash claimed successfully");
            await canClaimCash();
        } else {
            toast.error("Failed to claim cash");
        }
    }

    const getUserPortfolio = async () => {
        const response = await fetch(`${backendURL}/portfolio`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.success) {
            return;
        }
        const numCash = Number(data.cash);
        const numClaimedCash = Number(data.claimed_cash);
        
        setPortfolio({
            cash: numCash,
            claimed_cash: numClaimedCash,
            last_claim_date: data.last_claim_date
        });
    }

    const getLeaderBoardData = async () => {
        try {
            setIsLeaderboardLoading(true);

            const response = await fetch(`${backendURL}/portfolio/leaderboard`);
            const data = await response.json();

            if (!data.success) {
                console.log("error in get leaderboard data");
                return;
            }

            const MostCashPlayerData = data.MostCashPlayerData;
            const MostCashWageredData = data.MostCashWageredData;

            setLeaderboard({
                MostCashPlayerData,
                MostCashWageredData
            });

        } catch (error){
            console.log("Error in get leaderboard data:", error);
        } finally {
            setIsLeaderboardLoading(false);
        }
    }

    useEffect(() => {
        canClaimCash();
        getUserPortfolio();
    }, []);

    return (
        <PortfolioStore.Provider value={{ portfolio, canClaim, claimCash, canClaimCash, getUserPortfolio, getLeaderBoardData, leaderboard, isLeaderboardLoading }}>
            {children}
        </PortfolioStore.Provider>
    );
}