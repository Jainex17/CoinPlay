import { usePortfolioStore } from "@/store/PortfolioStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const LeaderBoard = () => {
  const { getLeaderBoardData, leaderboard, isLeaderboardLoading } = usePortfolioStore();

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

  const LeaderboardItemSkeleton = () => (
    <div className="flex items-center gap-5 sm:gap-7 p-2 sm:p-4 transition-all border-t border-border">
      <div className="min-w-[2rem] sm:min-w-[3rem] text-center">
        <Skeleton className="h-6 w-8 sm:h-8 sm:w-10 mx-auto" />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <Skeleton className="h-4 w-24 sm:w-32" />
          <Skeleton className="h-3 w-16 sm:w-20" />
        </div>
      </div>

      <div className="flex-shrink-0">
        <Skeleton className="h-4 w-16 sm:w-20" />
      </div>
    </div>
  );

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

            <div className="flex items-center gap-7 sm:gap-9 px-2 pt-1">
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground min-w-[2rem] sm:min-w-[3rem] text-center">
                Rank
              </div>
              <div className="flex-1 text-xs sm:text-sm font-semibold text-muted-foreground">
                Player
              </div>
              <div className="flex-shrink-0 text-xs sm:text-sm font-semibold text-muted-foreground">
                Total Cash
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {isLeaderboardLoading ? (
                // Show skeleton loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <LeaderboardItemSkeleton key={`cash-skeleton-${index}`} />
                ))
              ) : leaderboard?.MostCashPlayerData?.length > 0 ? (
                leaderboard.MostCashPlayerData.map((player, index) => (
                  <div
                    key={`cash-${index}`}
                    className={cn(
                      "flex items-center gap-5 sm:gap-7 p-2 sm:p-4 transition-all border-t border-border"
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

            <div className="flex items-center  gap-7 sm:gap-9 px-2 pt-1">
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground min-w-[2rem] sm:min-w-[3rem] text-center">
                Rank
              </div>
              <div className="flex-1 text-xs sm:text-sm font-semibold text-muted-foreground">
                Player
              </div>
              <div className="flex-shrink-0 text-xs sm:text-sm font-semibold text-muted-foreground">
                Total Money Bet
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {isLeaderboardLoading ? (
                // Show skeleton loading state
                Array.from({ length: 4 }).map((_, index) => (
                  <LeaderboardItemSkeleton key={`wagered-skeleton-${index}`} />
                ))
              ) : leaderboard?.MostCashWageredData?.length > 0 ? (
                leaderboard.MostCashWageredData.map((player, index) => (
                  <div
                    key={`most-cash-wagered-${index}`}
                    className={cn(
                      "flex items-center gap-5 sm:gap-7 p-2 sm:p-4 transition-all border-t border-border"
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
    </div>
  );
};
