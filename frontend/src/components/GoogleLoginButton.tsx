import { useEffect, useRef } from 'react';

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

export const GoogleLoginButton = () => {
  const client = useRef<TokenClient | null>(null);

  useEffect(() => {
    client.current = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      scope: 'email profile openid',
      redirect_uri: 'postmessage',
      callback: async (res: TokenResponse) => {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: res.access_token }),
        });
        const data = await r.json();
        console.log(data);
      },
    });
  }, []);

  return <button 
  className='bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer'
  onClick={() => client.current?.requestAccessToken()}>Login with Google</button>;
};
