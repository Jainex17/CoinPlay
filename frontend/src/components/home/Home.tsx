import { useAuthStore } from "@/store/AuthStore";
import { SidebarInset } from "../ui/sidebar";

export const Home = () => {

  const { handleLogin } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good Morning";
    } else if (hour < 17) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  const { user } = useAuthStore();
  

  return <>
    {!user ? (
    <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-6">
            <h1 className="text-3xl font-bold text-white">
              Welcome to CoinPlay!
            </h1>
            <p className="text-lg text-gray-300">
              You need to <span className="text-red-400 underline cursor-pointer" onClick={handleLogin}>sign in</span> or <span className="text-red-400 underline cursor-pointer" onClick={handleLogin}>create an account</span> to play.
            </p>
          </div>
        </div>
      </SidebarInset>
    ) : (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2 p-6">
          <h1 className="text-3xl font-bold text-white">
            {user.name} {getGreeting()}
          </h1>
        </div>
      </div>
    )}
  </>;
};
