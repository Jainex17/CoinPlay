import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "./AuthStore";

export interface PortfolioType {
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

export interface CoinHoldingType {
  amount: string;
  cid: number;
  name: string;
  symbol: string;
  token_reserve: string;
  base_reserve: string;
  total_spent: string;
  current_price: string;
}

export interface PublicPortfolioType {
  balance: number;
  claimed_cash: number;
  last_claim_date: Date | null;
  bets: BetsType[];
  coinHoldings: CoinHoldingType[];
  user: PublicUserType;
}

export interface MostCashPlayerType {
  name: string;
  picture: string;
  username: string;
  balance: number;
}

export interface MostCashWageredType {
  name: string;
  picture: string;
  username: string;
  total_bets: number;
  total_wagered: number;
}

export interface LeaderboardType {
  MostCashPlayerData: MostCashPlayerType[];
  MostCashWageredData: MostCashWageredType[];
}

interface PortfolioStore {
  publicPortfolio: PublicPortfolioType | null;
  isPublicPortfolioLoading: boolean;
  getUserPortfolioByUsername: (username: string) => Promise<void>;
  getLeaderBoardData: () => Promise<void>;
  leaderboard: LeaderboardType;
  isLeaderboardLoading: boolean;
}

const PortfolioStore = createContext<PortfolioStore | null>(null);
const backendURL =
  import.meta.env.VITE_BACKEND_URL + "/api" || "http://localhost:3000/api";

export const usePortfolioStore = () => {
  const context = useContext(PortfolioStore);
  if (!context) {
    throw new Error(
      "usePortfolioStore must be used within an PortfolioStoreProvider",
    );
  }
  return context;
};

export const PortfolioStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType>({
    MostCashPlayerData: [],
    MostCashWageredData: [],
  });

  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [publicPortfolio, setPublicPortfolio] =
    useState<PublicPortfolioType | null>(null);
  const [isPublicPortfolioLoading, setIsPublicPortfolioLoading] =
    useState(true);

  const { user } = useAuthStore();

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
        MostCashWageredData,
      });
    } catch (error) {
      console.log("Error in get leaderboard data:", error);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

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

      const numCash = Number(data.user.balance);
      const numClaimedCash = Number(data.user.claimed_cash);

      setPublicPortfolio({
        balance: numCash,
        claimed_cash: numClaimedCash,
        last_claim_date: data.user.last_claim_date,
        bets: data.bets,
        coinHoldings: data.coinHoldings || [],
        user: data.user,
      });
    } catch (error) {
      console.error("Error fetching public portfolio:", error);
      setPublicPortfolio(null);
    } finally {
      setIsPublicPortfolioLoading(false);
    }
  };

  useEffect(() => {
    user && getUserPortfolioByUsername(user.username);
  }, []);

  return (
    <PortfolioStore.Provider
      value={{
        publicPortfolio,
        isPublicPortfolioLoading,
        getUserPortfolioByUsername,
        getLeaderBoardData,
        leaderboard,
        isLeaderboardLoading,
      }}
    >
      {children}
    </PortfolioStore.Provider>
  );
};
