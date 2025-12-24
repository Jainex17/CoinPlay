import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AuthStoreProvider } from "./store/AuthStore";
import { PortfolioStoreProvider } from "./store/PortfolioStore";
import { toast, Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react"
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    toast.promise(
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`),
      {
        loading: "Checking backend status...",
        error: "Backend is down!",
      }
    )
  }, []);

  return (
    <AuthStoreProvider>
      <PortfolioStoreProvider>
        <SidebarProvider >
          <AppSidebar variant="inset" />
          <main className="flex-1 flex flex-col overflow-hidden p-3">
            <Toaster toastOptions={{
              style: {
                backgroundColor: "#1A1A1A",
                color: "#ffffff",
                border: "1px solid #3A3A3A",
              },
            }} />
            <div className="flex-1 overflow-auto bg-background rounded-xl shadow-sm border">
              {children}
            </div>
          </main>
          <Analytics />
        </SidebarProvider>
      </PortfolioStoreProvider>
    </AuthStoreProvider>
  );
}
