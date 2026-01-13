import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { DollarSign, BarChart3, Coins, Search } from "lucide-react";
import { useCoinStore } from "@/store/CoinStore";
import { useAuthStore } from "@/store/AuthStore";
import CreateCoinModal from "./CreateCoinModal";

const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toLocaleString();
};

const MarketPage = () => {
  const { coins } = useCoinStore();
  const { user } = useAuthStore();

  const totalCoins = coins.length;
  const totalSupply = coins.reduce((acc, coin) => acc + coin.total_supply, 0);
  const totalCirculating = coins.reduce(
    (acc, coin) => acc + coin.circulating_supply,
    0,
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pt-6 pb-24 px-6 md:px-12 mx-auto gap-10 overflow-x-hidden">
      <div className="flex flex-col gap-6 px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Coins className="w-8 h-8 text-muted-foreground" />
              <h1 className="text-3xl font-black tracking-tight">Market</h1>
            </div>
            <p className="text-muted-foreground font-medium">
              Explore and trade the hottest coins
            </p>
          </div>
          {user && (
            <CreateCoinModal />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Coins className="w-5 h-5 text-muted-foreground" />}
            label="Total Coins"
            value={totalCoins.toString()}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-muted-foreground" />}
            label="Total Supply"
            value={formatNumber(totalSupply)}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />}
            label="Circulating"
            value={formatNumber(totalCirculating)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {coins.map((coin) => (
          <Link to={`/coin/${coin.symbol.toLowerCase()}`} key={coin.symbol}>
            <Card className="bg-card/50 border-border shadow-xl rounded-xl p-6 hover:bg-muted/20 hover:scale-[1.02] transition-all duration-200 cursor-pointer group h-full">
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${coin.symbol}`}
                  alt={coin.name}
                  className="w-14 h-14 rounded-full border-2 border-border"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-black text-foreground group-hover:text-red-500 transition-colors">
                    {coin.name}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    ${coin.symbol}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between mb-5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Price
                  </span>
                  <span className="text-xl font-black text-foreground">
                    $
                    {coin.tokenReserve > 0
                      ? (coin.baseReserve / coin.tokenReserve).toFixed(7)
                      : coin.initial_price}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Creator
                  </span>
                  <span className="text-sm font-bold text-foreground/80">
                    @{coin.creator.username}
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Total Supply
                  </span>
                  <span className="text-sm font-bold text-foreground/80">
                    {formatNumber(coin.total_supply)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Circulating
                  </span>
                  <span className="text-sm font-bold text-foreground/80">
                    {formatNumber(coin.circulating_supply)}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {coins.length === 0 && (
          <Card className="bg-card/50 border-border shadow-xl rounded-xl p-12 text-center col-span-full">
            <div className="flex flex-col items-center gap-4">
              <Search className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                No coins found
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <Card className="bg-card/50 border-border p-5 flex gap-4 rounded-xl shadow-xl">
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <span className="text-xl font-black tracking-tight text-foreground">
          {value}
        </span>
      </div>
    </div>
  </Card>
);

export default MarketPage;
