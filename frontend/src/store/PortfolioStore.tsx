import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface PortfolioType {
    uid: string;
    name: string;
    email: string;
    picture: string;
    isAuthenticated: boolean;
}

interface PortfolioStore {
    cash: number;
    canClaim: boolean;
    lastClaim: Date | null;
    claimCash: () => Promise<void>;
    canClaimCash: () => Promise<void>;
}

const PortfolioStore = createContext<PortfolioStore | null>(null);
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api";

export const usePortfolioStore = () => {
    const context = useContext(PortfolioStore);
    if (!context) {
        throw new Error("usePortfolioStore must be used within an PortfolioStoreProvider");
    }
    return context;
}

export const PortfolioStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [cash, setCash] = useState(0);
    const [canClaim, setCanClaim] = useState(false);
    const [lastClaim, setLastClaim] = useState<Date | null>(null);

    const canClaimCash = async () => {
        const response = await fetch(`${backendURL}/auth/claim`, {
            credentials: 'include'
        });
        const data = await response.json();
        setCanClaim(data.canClaim);
        setLastClaim(data.lastClaim);
    }

    const claimCash = async () => {
        const response = await fetch(`${backendURL}/auth/claim`, {
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
            setCash(data.cash);
            toast.success("Cash claimed successfully");
            // Refresh claim status after successful claim
            await canClaimCash();
        } else {
            toast.error("Failed to claim cash");
        }
    }

    useEffect(() => {
        canClaimCash();
    }, []);

    return (
        <PortfolioStore.Provider value={{ cash, canClaim, lastClaim, claimCash, canClaimCash }}>
            {children}
        </PortfolioStore.Provider>
    );
}