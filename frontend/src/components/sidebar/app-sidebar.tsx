import { Coins, CombineIcon, Home, Wallet } from "lucide-react"

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

// Menu items.
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
    title: "Slots",
    url: "/slots",
    icon: CombineIcon,
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: Wallet,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4">
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

              <SidebarMenuItem>
                <button className="text-center w-full border-2 p-1 my-2 cursor-pointer rounded-xl bg-orange-800 font-bold">
                  Claim $500
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "https://github.com/shadcn.png",
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}