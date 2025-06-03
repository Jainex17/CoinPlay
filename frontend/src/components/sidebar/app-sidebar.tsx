import { Clock, Coins, CombineIcon, Gift, Home, Wallet } from "lucide-react"

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
import { useState } from "react";
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
    title: "Game",
    url: "#",
    icon: CombineIcon,
  },
  {
    title: "Portfolio",
    url: "#",
    icon: Wallet,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const [isClaimed, setIsClaimed] = useState(false);
  const { user } = useAuthStore();
  const handleClaim = () => {
  
    setIsClaimed(true);
    setTimeout(() => {
      const button = document.querySelector('button');
      if (button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<div class="flex items-center gap-2 justify-center"><p>Claimed!</p></div>';
        setTimeout(() => {
          button.innerHTML = originalContent;
        }, 1000);
      }
    }, 0);
  }

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
              {items.map((item) => {
                const isActive = location.pathname === item.url
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
                  className={`text-center w-full border-2 p-2 my-2 cursor-pointer rounded-xl ${isClaimed ? "bg-accent/10" : "bg-red-700/90"}`}
                  onClick={handleClaim}
                >
                  {isClaimed ? <div className="flex items-center gap-2 justify-center text-gray-300">
                    <Clock className="w-4 h-4" />
                    <p>Next in 12 hours</p>
                  </div> : <div className="flex items-center gap-2 justify-center">
                    <Gift className="w-4 h-4" />
                    <p>Claim $500</p>
                  </div>}
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