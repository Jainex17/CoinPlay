import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CoordinatesChart, { type Ohlc } from "../ui/chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp,
    TrendingDown,
    MessageSquare,
    DollarSign,
    BarChart3,
    PieChart,
    Coins
} from "lucide-react";
import { toast } from "sonner";
import { useCoinStore, type CoinType } from "@/store/CoinStore";
import { BuyCoinModal } from "./BuyCoinModal";
import { SellCoinModal } from "./SellCoinModal";

const CoinPage = () => {
    const { coinSymbol } = useParams<{ coinSymbol: string }>();
    const [coin, setCoin] = useState<CoinType | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [buyModalOpen, setBuyModalOpen] = useState(false);
    const [sellModalOpen, setSellModalOpen] = useState(false);
    const [chartData, setChartData] = useState<Ohlc[]>([]);

    const { getCoinBySymbol } = useCoinStore();

    async function fetchcoin() {
        setLoading(true);
        if (coinSymbol) {
            const coinData = await getCoinBySymbol(coinSymbol);
            setCoin(coinData);

            if (coinData?.priceHistory && coinData.priceHistory.length > 0) {
                const processed = processPriceHistory(coinData.priceHistory);
                setChartData(processed);
            }
        }
        setLoading(false);
    }

    function processPriceHistory(history: any[]): Ohlc[] {
        if (!history || history.length === 0) return [];

        const interval = 1 * 60 * 1000;
        const buckets: { [key: number]: any[] } = {};

        history.forEach(point => {
            const time = new Date(point.created_at).getTime();
            const bucketTime = Math.floor(time / interval) * interval;
            if (!buckets[bucketTime]) buckets[bucketTime] = [];
            buckets[bucketTime].push(point);
        });

        const sortedKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
        const ohlcData: Ohlc[] = sortedKeys.map(bucketTime => {
            const points = buckets[bucketTime];
            const prices = points.map(p => parseFloat(p.price_per_token));
            return {
                date: new Date(bucketTime),
                open: prices[0],
                high: Math.max(...prices),
                low: Math.min(...prices),
                close: prices[prices.length - 1]
            };
        });

        return ohlcData;
    }

    useEffect(() => {
        fetchcoin();
    }, [coinSymbol])

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!coin) {
        return <NoCoinFound />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground pt-6 pb-24 px-6 md:px-12 max-w-[1500px] mx-auto gap-10 overflow-x-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-6">
                        {coin.creator?.avatar && (
                            <img src={coin.creator.avatar} className="w-16 h-16 rounded-full border-2 border-border" alt={coin.name} />
                        )}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black tracking-tight">${coin.symbol?.toUpperCase()}</h1>
                                <span className="text-lg text-muted-foreground font-medium">{coin.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-muted-foreground font-medium">Created by</span>
                                <Link to={`/user/${coin.creator?.username}`} className="text-muted-foreground hover:text-foreground transition-colors duration-200">@{coin.creator?.username}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-end">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">{formatPrice(coin.price)}</h2>
                    <div className="flex items-center gap-2 py-1.5">
                        {(coin.change24h ?? 0) >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                        <span className={`text-lg font-black ${(coin.change24h ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {coin.change24h ?? 0}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                <div className="lg:col-span-8 flex flex-col gap-8">
                    <Card className="py-0 gap-0 bg-card/50 border-border shadow-2xl overflow-hidden rounded-xl">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-3 px-1">
                                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                <span className="text-base font-black text-foreground/80">Price Chart</span>
                            </div>
                        </div>
                        <div className="p-0 h-[550px] w-full bg-background overflow-hidden relative">
                            <CoordinatesChart data={chartData} />
                        </div>
                    </Card>

                    <div className="hidden lg:grid grid-cols-3 gap-6">
                        <StatCard icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} label="Market Cap" value={formatPrice(coin.marketCap ?? 0)} />
                        <StatCard icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />} label="24h Volume" value={formatPrice(coin.volume24h ?? 0)} />
                        <StatCard
                            icon={(coin.change24h ?? 0) >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                            label="24h Change"
                            value={`${coin.change24h ?? 0}%`}
                            valueColor={(coin.change24h ?? 0) >= 0 ? "text-success" : "text-destructive"}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-5">

                    <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                        <div className="space-y-4">
                            <Button
                                className="w-full h-14 bg-red-800 hover:bg-red-900 cursor-pointer text-red-50 text-base rounded-2xl"
                                onClick={() => setBuyModalOpen(true)}
                            >
                                <TrendingUp className="w-5 h-5 mr-2" /> Buy ${coin.symbol?.toUpperCase()}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-14 bg-muted/30 hover:bg-muted/20 text-foreground/60 text-base rounded-2xl cursor-pointer"
                                onClick={() => setSellModalOpen(true)}
                            >
                                <TrendingDown className="w-5 h-5 mr-2" /> Sell ${coin.symbol?.toUpperCase()}
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Top Holders</h3>
                        {coin.holders && coin.holders.length > 0 ? (
                            <div className="space-y-6">
                                {coin.holders.map((holder: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={holder.picture} className="w-12 h-12 rounded-full border-2 border-border" alt="" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">{i + 1}</div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground">{holder.name}</span>
                                                <span className="text-xs text-muted-foreground">@{holder.username}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono font-bold text-foreground/80">{holder.amount?.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground mt-1">${Number(holder.total_spent || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <Coins className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm font-medium">No holders yet</p>
                                <p className="text-xs opacity-70">Be the first to buy!</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 col-span-1 px-4">
                    <StatCard icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} label="Market Cap" value={formatPrice(coin.marketCap ?? 0)} />
                    <StatCard icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />} label="24h Volume" value={formatPrice(coin.volume24h ?? 0)} />
                    <StatCard icon={<PieChart className="w-5 h-5 text-muted-foreground" />} label="Circulating Supply" value={formatSupply(coin.circulating_supply ?? 0)} subValue={`of ${formatSupply(coin.total_supply ?? 0)} total`} />
                    <StatCard
                        icon={(coin.change24h ?? 0) >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                        label="24h Change"
                        value={`${coin.change24h ?? 0}%`}
                        valueColor={(coin.change24h ?? 0) >= 0 ? "text-success" : "text-destructive"}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-8 mt-2 px-2">
                <div className="flex items-center gap-4 px-4">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    <h3 className="text-2xl font-black tracking-tight">Comments</h3>
                </div>

                <Card className="bg-card/50 border-border rounded-xl p-0 overflow-hidden shadow-2xl">
                    <div className="flex flex-col p-2">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Share your thoughts about this coin..."
                            className="w-full bg-transparent p-1 outline-none text-foreground text-base font-medium resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                        />
                        <div className="flex justify-between items-center border-t border-border bg-muted/10">
                            <span className="text-xs font-bold text-muted-foreground/60 ml-4 pt-2">{comment.length}/500 characters</span>
                            <div className="flex items-center pt-2">
                                <Button
                                    onClick={() => {
                                        if (!comment) return;
                                        toast.success("Comment posted!");
                                        setComment("");
                                    }}
                                    className="bg-red-800 hover:bg-red-700 text-white text-xs px-6 rounded-lg cursor-pointer"
                                >
                                    Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col px-8">
                    {coin.comments && coin.comments.length > 0 ? (
                        coin.comments.map((c: any, i: number) => (
                            <div key={i} className="flex gap-6 group">
                                <img src={c.avatar} className="w-12 h-12 rounded-full border border-border mt-1 shadow-xl" alt="" />
                                <div className="flex flex-col flex-1 gap-2.5 border-b border-muted/20 pb-10 group-last:border-none">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-base font-black text-foreground hover:text-destructive transition-colors cursor-pointer">{c.user}</span>
                                            <span className="text-xs font-bold text-muted-foreground/60">@{c.username}</span>
                                            <span className="text-xs font-bold text-muted-foreground/40">{c.time}</span>
                                        </div>
                                    </div>
                                    <p className="text-base text-foreground/70 leading-relaxed font-medium">
                                        {c.text}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No comments yet</p>
                            <p className="text-xs opacity-70">Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </div>
            <BuyCoinModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} coin={coin} onSuccess={fetchcoin} />
            <SellCoinModal isOpen={sellModalOpen} setIsOpen={setSellModalOpen} coin={coin} onSuccess={fetchcoin} />
        </div>
    );
};

const StatCard = ({ icon, label, value, subValue, valueColor = "text-foreground" }: { icon: any, label: string, value: string, subValue?: string, valueColor?: string }) => (
    <Card className="bg-card/50 border-border p-6 flex flex-col gap-4 rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
                <span className={`text-2xl font-black tracking-tight ${valueColor}`}>
                    {value}
                </span>
                {subValue && <span className="text-xs font-bold text-muted-foreground/40">{subValue}</span>}
            </div>
        </div>
    </Card>
);

const formatPrice = (price: number) => {
    if (price === 0) return "$0.00";
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatSupply = (supply: number) => {
    if (supply >= 1_000_000_000) return `${(supply / 1_000_000_000).toFixed(2)}B`;
    if (supply >= 1_000_000) return `${(supply / 1_000_000).toFixed(2)}M`;
    if (supply >= 1_000) return `${(supply / 1_000).toFixed(2)}K`;
    return supply.toLocaleString();
};

const LoadingSkeleton = () => (
    <div className="flex flex-col min-h-screen bg-background text-foreground pt-6 pb-24 px-6 md:px-12 max-w-[1500px] mx-auto gap-10 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-6 w-20" />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-8">
                <Card className="py-0 gap-0 bg-card/50 border-border shadow-2xl overflow-hidden rounded-xl">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="p-0 h-[550px] w-full bg-background overflow-hidden relative">
                        <Skeleton className="h-full w-full" />
                    </div>
                </Card>
                <div className="hidden lg:grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-card/50 border-border p-6 flex flex-col gap-4 rounded-xl shadow-xl">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                        </Card>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-5">
                <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                    <div className="space-y-4">
                        <Skeleton className="h-14 w-full rounded-2xl" />
                        <Skeleton className="h-14 w-full rounded-2xl" />
                    </div>
                </Card>
                <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    </div>
);

const NoCoinFound = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-6">
        <div className="flex flex-col items-center gap-4">
            <div className="p-6 rounded-full bg-muted/30">
                <Coins className="w-16 h-16 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Coin Not Found</h1>
            <p className="text-muted-foreground text-center max-w-md">
                The coin you're looking for doesn't exist or may have been removed.
            </p>
            <Link to="/market">
                <Button className="mt-4 bg-red-800 hover:bg-red-900 text-white">
                    Browse Market
                </Button>
            </Link>
        </div>
    </div>
);

export default CoinPage;
