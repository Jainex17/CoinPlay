import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";
import coinFront from "../assets/coinfront.png";
import coinBack from "../assets/coinback.png";
import { useAuthStore } from "@/store/AuthStore";
import { LoginBox } from "./LoginBox";

export const CoinFlip = () => {
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [animationResult, setAnimationResult] = useState<'heads' | 'tails' | null>(null);

  const [isWin, setIsWin] = useState<boolean>(false);
  const [AmountWagered, setAmountWagered] = useState<number>(0);
  const [betSide, setBetSide] = useState<'heads' | 'tails' | null>(null);

  const { user, getUser } = useAuthStore();

  const maxBet = 100000;

  const handlePercentageBet = (percentage: number) => {
    if (!user) return;
    const amount = Math.floor((user.balance * percentage) / 100);
    setBetAmount(Math.min(amount, maxBet));
  };

  const handleFlip = async () => {
    if (!user) return;
    if (betAmount <= 0 || betAmount > user?.balance || betAmount > maxBet) return;

    setIsFlipping(true);
    setAnimationResult(null);
    setResult(null);
    setBetSide(selectedSide);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gambling/coinflip`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ userChoice: selectedSide, betAmount }),
    });

    const data = await res.json();
    if (data.success) {
      setAnimationResult(data.result);
      setIsWin(data.result === selectedSide);
      setAmountWagered(data.AmountWagered);

      setTimeout(() => {
        setResult(data.result);
        user && getUser();
        setIsFlipping(false);
      }, 3000);
    } else {
      setIsFlipping(false);
    }
  };

  useEffect(() => {
    if (user) {
      getUser();
    }
  }, []);

  if (!user) {
    return (
      <LoginBox />
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:h-[calc(100vh-80px)] h-auto">
      <div className="w-full max-w-5xl bg-card/50 border border-border/30 rounded-2xl shadow-2xl">

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-center">
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Balance</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  {user?.balance
                    ? user.balance >= 1000
                      ? `$${(user.balance / 1000).toFixed(2)}K`
                      : `$${user.balance.toFixed(2)}`
                    : '$0.00'
                  }
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl scale-70 animate-pulse"></div>

                <div className="coin-container relative z-10 drop-shadow-2xl">
                  <div
                    className={cn(
                      "coin",
                      isFlipping && animationResult === 'heads' && "animate-heads",
                      isFlipping && animationResult === 'tails' && "animate-tails",
                      !isFlipping && result === 'tails' && "flipped"
                    )}
                  >

                    <div className="coin-side">
                      <img
                        src={coinFront}
                        alt="Heads"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="coin-side back">
                      <img
                        src={coinBack}
                        alt="Tails"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex items-center justify-center">
                {result && !isFlipping && betSide && (
                  <div className={cn(
                    "w-full text-center py-2 rounded-lg font-bold backdrop-blur-sm border",
                    isWin
                      ? "text-white bg-green-600 border-green-500/30"
                      : "text-white bg-red-500/50 border-red-500/30"
                  )}>
                    <div className="text-sm sm:text-base lg:text-xl font-extrabold">
                      {isWin ? "Won!" : "Lost!"}
                    </div>
                    <div className="text-sm font-medium">
                      {isWin
                        ? `Won $${AmountWagered * 2} on your ${betSide} bet!`
                        : `Lost $${AmountWagered} on your ${betSide} bet`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>


            <div className="space-y-5">

              <div className="space-y-3">
                <label className="block text-base font-semibold text-white">
                  Choose Side
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedSide('heads')}
                    className={cn(
                      "h-12 text-base font-semibold cursor-pointer rounded-lg",
                      selectedSide === 'heads' ? "bg-red-700 text-white" : "bg-input/50 text-white",
                    )}
                    disabled={isFlipping}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span>Heads</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedSide('tails')}
                    className={cn(
                      "h-12 text-base font-semibold cursor-pointer rounded-lg",
                      selectedSide === 'tails' ? "bg-red-700 text-white" : "bg-input/50 text-white",

                    )}
                    disabled={isFlipping}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span>Tails</span>
                    </div>
                  </button>
                </div>
              </div>


              <div className="space-y-3">
                <label className="block text-base font-semibold text-white">
                  Bet Amount
                </label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="h-12 text-lg font-medium bg-input/50 border-input/50 focus:bg-input/70 focus:border-primary/50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    min="1"
                    max={maxBet}
                    disabled={isFlipping}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max bet: {maxBet.toLocaleString()}
                  </p>
                </div>
              </div>


              <div className="space-y-3">
                <label className="block text-base font-semibold text-white">
                  Quick Bet
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      onClick={() => handlePercentageBet(percentage)}
                      disabled={isFlipping}
                      className="h-10 text-sm font-medium"
                    >
                      {percentage === 100 ? 'Max' : `${percentage}%`}
                    </Button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFlip}
                disabled={isFlipping || betAmount <= 0 || betAmount > user?.balance || betAmount > maxBet}
                className={cn(
                  "w-full h-14 text-lg font-bold transition-all bg-red-700 text-white rounded-lg cursor-pointer hover:bg-red-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isFlipping && "animate-pulse"
                )}
              >
                {isFlipping ? (
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Flipping...
                  </div>
                ) : (
                  'Flip Coin'
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
