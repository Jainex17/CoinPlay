import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface PortfolioType {
    cash: number;
    claimed_cash: number;
    last_claim_date: Date | null;
    bets: BetsType[];
}

export interface BetsType {
    bid: number;
    bet_amount: string;
    bet_result: string;
    created_at: Date;
}

export interface PublicUserType {
    name: string;
    picture: string;
    username: string;
    created_at: Date;
}

export interface PublicPortfolioType {
    cash: number;
    claimed_cash: number;
    last_claim_date: Date | null;
    bets: BetsType[];
    user: PublicUserType;
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
    publicPortfolio: PublicPortfolioType | null;
    isPublicPortfolioLoading: boolean;
    getUserPortfolioByUsername: (username: string) => Promise<void>;
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
        last_claim_date: null,
        bets: []
    });
    const [leaderboard, setLeaderboard] = useState<LeaderboardType>({
        MostCashPlayerData: [],
        MostCashWageredData: []
    });

    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
    const [publicPortfolio, setPublicPortfolio] = useState<PublicPortfolioType | null>(null);
    const [isPublicPortfolioLoading, setIsPublicPortfolioLoading] = useState(true);

    const [canClaim, setCanClaim] = useState(false);

    const canClaimCash = async () => {
        const response = await fetch(`${backendURL}/portfolio/claim`, {
            credentials: 'include'
        });
        const data = await response.json();
        setCanClaim(data.canClaim);
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
            toast.success("Cash claimed successfully");
            await canClaimCash();
            await getUserPortfolio();
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
            last_claim_date: data.last_claim_date,
            bets: data.bets
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

        } catch (error) {
            console.log("Error in get leaderboard data:", error);
        } finally {
            setIsLeaderboardLoading(false);
        }
    }

    const getUserPortfolioByUsername = async (username: string) => {
        try {
            setIsPublicPortfolioLoading(true);
            setPublicPortfolio(null);

            const response = await fetch(`${backendURL}/portfolio/${username}`);
            const data = await response.json();

            if (!data.success) {
                setPublicPortfolio(null);
                return;
            }

            const numCash = Number(data.cash);
            const numClaimedCash = Number(data.claimed_cash);

            setPublicPortfolio({
                cash: numCash,
                claimed_cash: numClaimedCash,
                last_claim_date: data.last_claim_date,
                bets: data.bets,
                user: data.user
            });
        } catch (error) {
            console.error("Error fetching public portfolio:", error);
            setPublicPortfolio(null);
        } finally {
            setIsPublicPortfolioLoading(false);
        }
    }

    useEffect(() => {
        canClaimCash();
        getUserPortfolio();
    }, []);

    return (
        <PortfolioStore.Provider value={{ portfolio, publicPortfolio, isPublicPortfolioLoading, getUserPortfolioByUsername, canClaim, claimCash, canClaimCash, getUserPortfolio, getLeaderBoardData, leaderboard, isLeaderboardLoading }}>
            {children}
        </PortfolioStore.Provider>
    );
}