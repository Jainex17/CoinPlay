import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "../lib/auth";
import { backendURL } from "../lib/config";

export interface UserType {
    uid: string;
    name: string;
    email: string;
    picture: string;
    username: string;
    isAuthenticated: boolean;
    balance: number;
    claimed_cash: number;
    last_claim_date: Date;
    created_at: Date;
}

interface AuthStore {
    user: UserType | null;
    handleLogin: () => Promise<void>;
    getUser: () => Promise<void>;
    handleLogout: () => Promise<void>;
    loginLoading: boolean;
    canClaim: boolean;
    claimCash: () => Promise<void>;
    canClaimCash: () => Promise<void>;
}

const AuthStore = createContext<AuthStore | null>(null);
export const useAuthStore = () => {
    const context = useContext(AuthStore);

    if (!context) {
        throw new Error("useAuthStore must be used within an AuthStoreProvider");
    }
    return context;
}

export const AuthStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [canClaim, setCanClaim] = useState(false);

    const handleLogin = async () => {
        setLoginLoading(true);
        try {
            if (!window.google?.accounts?.oauth2) {
                throw new Error("Google authentication is unavailable");
            }

            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
                scope: 'email profile openid',
                redirect_uri: 'postmessage',
                callback: (res: TokenResponse) => {
                    void (async () => {
                        if (!res.access_token) throw new Error('Google did not return an access token');
                        const response = await fetch(`${backendURL}/auth/google`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ access_token: res.access_token }),
                        });

                        if (!response.ok) throw new Error('Failed to authenticate with Google');

                        const data = await response.json();
                        if (!data.user) throw new Error('Authentication response was invalid');
                        setUser(data.user);
                        toast.success('Successfully logged in!');
                    })().catch((error: unknown) => {
                        console.error('Error logging in:', error);
                        toast.error('Failed to login');
                    }).finally(() => setLoginLoading(false));
                },
            });
            client.requestAccessToken();
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error('Failed to login');
            setLoginLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoginLoading(true);
        try {
            const response = await fetch(`${backendURL}/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error("Failed to logout");
            }
            setUser(null);
            toast.success('Successfully logged out!');
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error("Failed to logout");
        } finally {
            setLoginLoading(false);
        }
    }

    const getUser = useCallback(async () => {
        try {
            const response = await fetch(`${backendURL}/auth/me`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.user) setUser(data.user);
            else setUser(null);
        } catch (error) {
            console.error("Error loading authenticated user:", error);
            setUser(null);
        }
    }, []);

    const canClaimCash = useCallback(async () => {
        try {
            const response = await fetch(`${backendURL}/auth/claim`, {
                credentials: 'include',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            setCanClaim(response.ok && data.canClaim === true);
        } catch (error) {
            console.error("Error checking cash claim eligibility:", error);
            setCanClaim(false);
        }
    }, []);

    const claimCash = async () => {
        try {
            const response = await fetch(`${backendURL}/auth/claim`, {
                credentials: 'include',
                method: 'POST',
                body: JSON.stringify({}),
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast.success("Cash claimed successfully");
                await canClaimCash();
                if (user) await getUser();
            } else {
                toast.error(data.message || "Failed to claim cash");
            }
        } catch (error) {
            console.error("Error claiming cash:", error);
            toast.error("Failed to claim cash");
        }
    }

    useEffect(() => {
        getUser();
        canClaimCash();
    }, [canClaimCash, getUser]);

    return (
        <AuthStore.Provider
            value={{
                user,
                handleLogin,
                handleLogout,
                getUser,
                loginLoading,
                canClaim,
                claimCash,
                canClaimCash
            }}
        >
            {children}
        </AuthStore.Provider>
    );
}

export default AuthStore;


declare global {
    interface Window {
        google: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        redirect_uri?: string;
                        callback: (response: TokenResponse) => void;
                    }) => TokenClient;
                };
            };
        };
    }
}

interface TokenResponse {
    access_token?: string;
}

interface TokenClient {
    requestAccessToken: () => void;
}
