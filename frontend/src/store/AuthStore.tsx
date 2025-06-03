import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface UserType {
    uid: string;
    name: string;
    email: string;
    picture: string;
    isAuthenticated: boolean;
}

interface AuthStore {
    user: UserType | null;
    handleLogin: () => Promise<void>;
    handleLogout: () => Promise<void>;
    loginLoading: boolean;
}

const AuthStore = createContext<AuthStore | null>(null);
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

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

    const handleLogin = async () => {
        setLoginLoading(true);
        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
                scope: 'email profile openid',
                redirect_uri: 'postmessage',
                callback: async (res: TokenResponse) => {
                    const response = await fetch(`${backendURL}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ access_token: res.access_token }),
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to authenticate with Google');
                    }

                    const data = await response.json();
                    setUser(data.user);
                    toast.success('Successfully logged in!');
                },
            });
            client.requestAccessToken();
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error('Failed to login');
        } finally {
            setLoginLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoginLoading(true);
        try {
            const response = await fetch(`${backendURL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
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

    const getUser = async () => {
        const response = await fetch(`${backendURL}/api/auth/me`, {
            credentials: "include",
        });
        const data = await response.json();
        setUser(data.user);
    }

    useEffect(() => {
        getUser();
    }, []);


  return (
    <AuthStore.Provider 
    value={{
        user,
        handleLogin,
        handleLogout,
        loginLoading,
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
    access_token: string;
  }
  
  interface TokenClient {
    requestAccessToken: () => void;
  }