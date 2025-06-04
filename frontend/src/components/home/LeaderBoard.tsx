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
    <div className="py-2 sm:py-4 space-y-4 sm:space-y-6 mt-2">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card/50 border border-border/30 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-start gap-2">
                💰 Richest Players
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Players with the most cash
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {leaderboard?.MostCashPlayerData?.length > 0 ? (
                leaderboard.MostCashPlayerData.map((player, index) => (
                  <div
                    key={`cash-${index}`}
                    className={cn(
                      "flex items-center gap-2 sm:gap-4 p-2 sm:p-4 transition-all border-t border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "text-lg sm:text-2xl font-bold min-w-[2rem] sm:min-w-[3rem] text-center"
                      )}
                    >
                      {getRankIcon(index)}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={player.picture}
                          alt={player.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-border/50 relative z-10"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-sm sm:text-base">
                          {player.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Cash Balance
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <p className={cn("font-semibold text-gray-300 text-sm sm:text-base")}>
                        {formatCash(player.cash)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <p className="text-sm sm:text-base">No players found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border/30 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-start gap-2">
                💰 Most Cash Wagered
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Players with the most cash wagered
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {leaderboard?.MostCashWageredData?.length > 0 ? (
                leaderboard.MostCashWageredData.map((player, index) => (
                  <div
                    key={`most-cash-wagered-${index}`}
                    className={cn(
                      "flex items-center gap-2 sm:gap-4 p-2 sm:p-4 transition-all border-t border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "text-lg sm:text-2xl font-bold min-w-[2rem] sm:min-w-[3rem] text-center"
                      )}
                    >
                      {getRankIcon(index)}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={player.picture}
                          alt={player.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-border/50 relative z-10"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-sm sm:text-base">
                          {player.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground"> 
                          {player.total_bets.toLocaleString()} bets  
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <p className={cn("font-semibold text-gray-300 text-sm sm:text-base")}>
                        {formatCash(player.total_wagered)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <p className="text-sm sm:text-base">No players found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        
    <div className="flex justify-center sm:justify-end">
      <button
        onClick={() => getLeaderBoardData()}
        className="px-4 sm:px-6 py-2 bg-input/40 text-white font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 text-sm sm:text-base"
        >
        <RefreshCcw className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">Refresh Leaderboard</span>
        <span className="xs:hidden">Refresh</span>
      </button>
          </div>
    </div>
  );
};
