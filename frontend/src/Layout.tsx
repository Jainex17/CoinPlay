import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider >
      <AppSidebar variant="inset" />
      <main className="flex-1 flex flex-col overflow-hidden p-3">
        <div className="flex-1 overflow-auto bg-background rounded-xl shadow-sm border">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
