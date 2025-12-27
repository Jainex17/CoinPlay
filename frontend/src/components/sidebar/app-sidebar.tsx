import { Clock, Coins, FileText, Gift, Home, Shield, Wallet } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { NavUser } from "./nav-user"
import logo from "../../assets/coinfront.png";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/AuthStore";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "CoinFlip",
    url: "/coinflip",
    icon: Coins,
  },
  {
    title: "Terms of Service",
    url: "/terms",
    icon: FileText,
  },
  {
    title: "Privacy Policy",
    url: "/privacy",
    icon: Shield,
  }
]

const formatTimeLeft = (milliseconds: number): string => {
  if (milliseconds <= 0) return "0h 0min";

  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}min`;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { canClaim, claimCash, canClaimCash } = useAuthStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const menuItems = [
    ...items.slice(0, 2),
    {
      title: "Portfolio",
      url: user?.username ? `/user/${user.username}` : "/portfolio",
      icon: Wallet,
    },
    ...items.slice(2),
  ];

  useEffect(() => {
    if (user) {
      canClaimCash();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (user?.last_claim_date) {
      const lastClaimDate = new Date(user?.last_claim_date);
      const nextClaimDate = new Date(lastClaimDate.getTime() + 1000 * 60 * 60 * 12);

      const updateTimeLeft = () => {
        const now = new Date();
        const timeDiff = nextClaimDate.getTime() - now.getTime();
        setTimeLeft(Math.max(0, timeDiff));
        setIsLoading(false);
      };

      updateTimeLeft();

      const interval = setInterval(updateTimeLeft, 60000);

      return () => clearInterval(interval);
    } else if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user?.last_claim_date]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 flex flex-row">
        <img src={logo} alt="Coinplay" width={30} height={30} />
        <h1 className="text-lg font-bold">Coinplay</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.title === "Portfolio" && location.pathname.startsWith("/user/"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        to={item.url}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {user && (
                <SidebarMenuItem>
                  <button
                    className={`text-center w-full border-2 p-2 my-2 cursor-pointer rounded-lg ${(!canClaim || isLoading) ? "bg-accent/10" : "bg-red-700/90"}`}
                    onClick={claimCash}
                    disabled={!canClaim || isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 justify-center text-gray-300">
                        <Clock className="w-4 h-4 animate-spin" />
                        <p>Loading...</p>
                      </div>
                    ) : !canClaim ? (
                      <div className="flex items-center gap-2 justify-center text-gray-300">
                        <Clock className="w-4 h-4" />
                        <p>Next in {formatTimeLeft(timeLeft)}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-center">
                        <Gift className="w-4 h-4" />
                        <p>Claim $1500</p>
                      </div>
                    )}
                  </button>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}