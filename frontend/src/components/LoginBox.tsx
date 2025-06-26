import { Button } from "./ui/button";
import coinFront from "../assets/coinfront.png";
import { useAuthStore } from "@/store/AuthStore";

export const LoginBox = () => {
    const { handleLogin } = useAuthStore();

  return <>
    <div className="flex flex-1 items-center justify-center p-4 lg:h-[calc(100vh-80px)] h-auto">
        <div className="w-full max-w-md bg-card/50 border border-border/30 rounded-2xl shadow-2xl p-8">
          <div className="text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-[55%] left-1/2 -translate-x-1/2 inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl scale-70 animate-pulse"></div>
              <div className="coin-container relative z-10 drop-shadow-2xl">
                <div className="coin">
                  <div className="coin-side">
                    <img 
                      src={coinFront} 
                      alt="Heads" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Please Login to Place Bet</h2>
              <p className="text-muted-foreground text-base">
                You need to be logged in to start playing coin flip and place bets.
              </p>
              
              <div className="space-y-3 pt-4">
                <Button 
                  className="w-full h-12 text-base font-semibold bg-red-700 hover:bg-red-600 text-white cursor-pointer"
                  onClick={() => {handleLogin()}}
                >
                  Login to Your Account
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button 
                    className="text-red-400 hover:text-red-300 font-medium underline cursor-pointer"
                    onClick={() => {handleLogin()}}
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  </>;
};
