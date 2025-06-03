import { useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { GoogleLoginButton } from "./GoogleLoginButton";

export const Navbar = () => {
    const location = useLocation();
  return <>
    <header className="flex border-b p-2">
      <div className="flex w-full items-center gap-1 px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{location.pathname === "/" ? "Home" : location.pathname.split("/")[1].charAt(0).toUpperCase() + location.pathname.split("/")[1].slice(1)}</h1>
        
        <GoogleLoginButton />
      </div>
    </header>
  </>;
};
