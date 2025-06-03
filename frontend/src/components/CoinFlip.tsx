import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import coinFront from "../assets/coinfront.png";
import coinBack from "../assets/coinback.png";

export const CoinFlip = () => {
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [balance] = useState<number>(3700);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);
  
  const maxBet = 10000;
  
  const handlePercentageBet = (percentage: number) => {
    const amount = Math.floor((balance * percentage) / 100);
    setBetAmount(Math.min(amount, maxBet));
  };
  
  const handleFlip = async () => {
    if (betAmount <= 0 || betAmount > balance || betAmount > maxBet) return;
    
    setIsFlipping(true);
    setResult(null);
    setFlipResult(null);
    
    const newResult = Math.random() < 0.5 ? 'heads' : 'tails';
    setFlipResult(newResult);
    
    // Show result after animation
    setTimeout(() => {
      setResult(newResult);
      setIsFlipping(false);
    }, 3000);
  };
  
  return (
    <div className="flex flex-1 items-center justify-center p-4 h-[calc(100vh-80px)]">
      <div className="w-full max-w-5xl bg-card/50 border border-border/30 rounded-2xl shadow-2xl">
        
        
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Balance</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  ${(balance / 1000).toFixed(2)}K
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl scale-70 animate-pulse"></div>
                
                <div className="coin-container relative z-10 drop-shadow-2xl">
                  <div 
                    className={cn(
                      "coin",
                      isFlipping && flipResult === 'heads' && "animate-heads",
                      isFlipping && flipResult === 'tails' && "animate-tails",
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
              
              <div className="w-full h-16 flex items-center justify-center">
                {result && !isFlipping && (
                  <div className={cn(
                    "w-full text-center py-2 rounded-lg font-bold backdrop-blur-sm border",
                    result === selectedSide 
                      ? "text-white bg-green-600 border-green-500/30" 
                      : "text-white bg-red-500/50 border-red-500/30"
                  )}>
                    <div className="text-sm sm:text-base lg:text-xl font-extrabold">
                      {result.toUpperCase()}
                    </div>
                    <div className="text-sm font-medium">
                      {result === selectedSide 
                        ? `Won $${betAmount} on your bet!`
                        : `Lost $${betAmount} on your bet`
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
                    className="h-12 text-lg font-medium bg-input/50 border-input/50 focus:bg-input/70 focus:border-primary/50"
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
                disabled={isFlipping || betAmount <= 0 || betAmount > balance || betAmount > maxBet}
                className={cn(
                  "w-full h-14 text-lg font-bold transition-all bg-red-700 text-white rounded-lg",
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
