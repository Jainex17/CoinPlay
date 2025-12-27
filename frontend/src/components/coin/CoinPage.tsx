import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import CoordinatesChart from "../ui/chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    TrendingDown,
    Rocket,
    MessageSquare,
    Share2,
    MoreHorizontal,
    Heart,
    DollarSign,
    BarChart3,
    PieChart
} from "lucide-react";
import { toast } from "sonner";

const CoinPage = () => {
    const { coinname } = useParams<{ coinname: string }>();
    const [comment, setComment] = useState("");

    const name = coinname;
    const symbol = coinname;

    const coinData = {
        name: name,
        symbol: symbol,
        price: 2558.33,
        change24h: -5.63,
        creator: {
            name: "AssassiN",
            handle: "assassin",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AssassiN"
        },
        marketCap: "2558.33B",
        volume24h: "1.59M",
        supply: "1.00B",
        totalLiquidity: "101,159,865.451",
        poolComposition: {
            lock: "19.77K",
            base: "58,579,932.726"
        },
        holders: [
            { name: "AssassiN", handle: "@assassin", percentage: "100.0%", amount: "999.98M", value: "$25.23M", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AssassiN" },
            { name: "Stonks", handle: "@stonks", percentage: "0.0%", amount: "5", value: "$12.79K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stonks" },
            { name: "sensel32456", handle: "@lucky_wolf796", percentage: "0.0%", amount: "2.483", value: "$6.15K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sensel32456" },
        ],
        comments: [
            { user: "Stonks", handle: "@stonks", text: "so you don't know the laundering...", time: "7h ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stonks" },
            { user: "pat", handle: "@10kboosterguy", text: "@stonks yeah, so just for proof that I know, reme was the creator of the formerly popular rugplay coin, it was pretty popular, but then one day, reme decided to rugpull the whole coin, absolutely destroying the coin, people lost millions, and that rugpull gained reme a 1# spot on the most money leaderboard", time: "7h ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pat" },
            { user: "Stonks", handle: "@stonks", text: "pat do you know the reme lore?", time: "12h ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stonks" },
        ]
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground pt-6 pb-24 px-6 md:px-12 max-w-[1500px] mx-auto gap-10 overflow-x-hidden">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black tracking-tight">${coinData.name?.toUpperCase()}</h1>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-muted-foreground font-medium">Created by</span>
                                <Link to={`/user/${coinData.creator.handle}`} className="text-muted-foreground hover:text-foreground transition-colors duration-200">@{coinData.creator.handle}</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-end">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">${coinData.price.toLocaleString()}</h2>
                    <div className="flex items-center gap-2 py-1.5">
                        {coinData.change24h > 0 ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                        <span className="text-lg font-black text-destructive">{coinData.change24h}%</span>
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
                            <CoordinatesChart />
                        </div>
                    </Card>

                    <div className="hidden lg:grid grid-cols-3 gap-6">
                        <StatCard icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} label="Market Cap" value={`$${coinData.marketCap}`} />
                        <StatCard icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />} label="24h Volume" value={`$${coinData.volume24h}`} />
                        <StatCard icon={<TrendingDown className="w-5 h-5 text-destructive" />} label="24h Change" value={`${coinData.change24h}%`} valueColor="text-destructive" />
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-5">

                    <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                        <div className="space-y-4">
                            <Button className="w-full h-14 bg-red-800 hover:bg-red-900 cursor-pointer text-red-50 text-base rounded-2xl">
                                <TrendingUp className="w-5 h-5 mr-2" /> Buy ${coinData.symbol?.toUpperCase()}
                            </Button>
                            <Button variant="outline" className="w-full h-14 bg-muted/30 hover:bg-muted/20 text-foreground/60 text-base rounded-2xl">
                                <TrendingDown className="w-5 h-5 mr-2" /> Sell ${coinData.symbol?.toUpperCase()}
                            </Button>
                        </div>
                    </Card>

                    {/* Top Holders Card */}
                    <Card className="bg-card/50 border-border shadow-2xl rounded-xl p-8">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Top Holders</h3>
                        <div className="space-y-6">
                            {coinData.holders.map((holder, i) => (
                                <div key={i} className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img src={holder.avatar} className="w-12 h-12 rounded-full border-2 border-border" alt="" />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">{i + 1}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-foreground">{holder.name}</span>
                                            <span className="text-xs text-muted-foreground">{holder.handle}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono font-bold text-foreground/80">{holder.amount}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground mt-1">{holder.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Mobile Stats */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 col-span-1 px-4">
                    <StatCard icon={<DollarSign className="w-5 h-5 text-muted-foreground" />} label="Market Cap" value={`$${coinData.marketCap}`} />
                    <StatCard icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />} label="24h Volume" value={`$${coinData.volume24h}`} />
                    <StatCard icon={<PieChart className="w-5 h-5 text-muted-foreground" />} label="Circulating Supply" value={`${coinData.supply}`} subValue="of 1.00B total" />
                    <StatCard icon={<TrendingDown className="w-5 h-5 text-destructive" />} label="24h Change" value={`${coinData.change24h}%`} valueColor="text-destructive" />
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

                {/* Comment List */}
                <div className="flex flex-col px-8">
                    {coinData.comments.map((c, i) => (
                        <div key={i} className="flex gap-6 group">
                            <img src={c.avatar} className="w-12 h-12 rounded-full border border-border mt-1 shadow-xl" alt="" />
                            <div className="flex flex-col flex-1 gap-2.5 border-b border-muted/20 pb-10 group-last:border-none">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-base font-black text-foreground hover:text-destructive transition-colors cursor-pointer">{c.user}</span>
                                        <span className="text-xs font-bold text-muted-foreground/60">{c.handle}</span>
                                        <span className="text-xs font-bold text-muted-foreground/40">{c.time}</span>
                                    </div>
                                </div>
                                <p className="text-base text-foreground/70 leading-relaxed font-medium">
                                    {c.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
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

export default CoinPage;
