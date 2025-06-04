import { usePortfolioStore } from "@/store/PortfolioStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

export const LeaderBoard = () => {
  const { getLeaderBoardData, leaderboard } = usePortfolioStore();

  useEffect(() => {
    getLeaderBoardData();
  }, []);

  const formatCash = (cash: number) => {
    const numCash = Number(cash);
    if (numCash >= 1000000) {
      return `$${(numCash / 1000000).toFixed(2)}M`;
    } else if (numCash >= 1000) {
      return `$${(numCash / 1000).toFixed(2)}K`;
    } else {
      return `$${numCash.toFixed(2)}`;
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  return (
    <div className="py-4 space-y-6 mt-2">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card/50 border border-border/30 rounded-2xl shadow-2xl p-6">
          <div className="space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-bold text-white flex items-center justify-start gap-2">
                💰 Richest Players
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Players with the most cash
              </p>
            </div>

            <div className="space-y-3">
              {leaderboard?.MostCashPlayerData?.length > 0 ? (
                leaderboard.MostCashPlayerData.map((player, index) => (
                  <div
                    key={`cash-${index}`}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-all border-t border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "text-2xl font-bold min-w-[3rem] text-center"
                      )}
                    >
                      {getRankIcon(index)}
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img
                          src={player.picture}
                          alt={player.name}
                          className="w-10 h-10 rounded-full border-2 border-border/50 relative z-10"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {player.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cash Balance
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className={cn("font-semibold text-gray-300")}>
                        {formatCash(player.cash)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No players found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-2xl shadow-2xl p-6">
          <div className="space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-bold text-white flex items-center justify-start gap-2">
                💰 Most Cash Wagered
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Players with the most cash wagered
              </p>
            </div>

            <div className="space-y-3">
              {leaderboard?.MostCashWageredData?.length > 0 ? (
                leaderboard.MostCashWageredData.map((player, index) => (
                  <div
                    key={`most-cash-wagered-${index}`}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-all border-t border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "text-2xl font-bold min-w-[3rem] text-center"
                      )}
                    >
                      {getRankIcon(index)}
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img
                          src={player.picture}
                          alt={player.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border-2 border-border/50 relative z-10"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {player.name}
                        </p>
                        <p className="text-sm text-muted-foreground"> 
                          {player.total_bets.toLocaleString()} bets  
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className={cn("font-semibold text-gray-300")}>
                        {formatCash(player.total_wagered)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No players found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        
    <div className="flex justify-end">
      <button
        onClick={() => getLeaderBoardData()}
        className="px-6 py-2 bg-input/40 text-white font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2"
        >
        <RefreshCcw className="w-4 h-4" />
        Refresh Leaderboard
      </button>
          </div>
    </div>
  );
};
