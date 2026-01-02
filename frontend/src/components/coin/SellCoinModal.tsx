import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins } from "lucide-react";
import { useCoinStore, type CoinType } from "@/store/CoinStore";
import { toast } from "sonner";
import { useAuthStore } from "@/store/AuthStore";

interface SellCoinModalProps {
    coin: CoinType;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSuccess?: () => void;
}

export const SellCoinModal = ({ coin, isOpen, setIsOpen, onSuccess }: SellCoinModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [usdValue, setUsdValue] = useState<number>(0);
    const { user, getUser } = useAuthStore();
    const { sellCoin, getCoinBySymbol } = useCoinStore();

    const userHoldings = useMemo(() => {
        if (!user || !coin.holders) return 0;
        const holder = coin.holders.find(h => h.username === user.username);
        return holder ? Number(holder.amount) : 0;
    }, [user, coin.holders]);

    useEffect(() => {
        const tokenAmount = parseFloat(amount);
        if (!isNaN(tokenAmount) && tokenAmount > 0 && coin.tokenReserve > 0 && coin.baseReserve > 0) {
            const k = coin.tokenReserve * coin.baseReserve;
            const newTokenReserve = coin.tokenReserve + tokenAmount;
            const newBaseReserve = k / newTokenReserve;
            const baseOut = coin.baseReserve - newBaseReserve;
            setUsdValue(Math.floor(baseOut));
        } else {
            setUsdValue(0);
        }
    }, [amount, coin.tokenReserve, coin.baseReserve]);

    const handleSell = async () => {
        const value = parseFloat(amount);
        if (!user) {
            toast.error("Please login to sell coins");
            return;
        }

        if (isNaN(value) || value <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (value > userHoldings) {
            toast.error("Insufficient tokens");
            return;
        }

        const res = await sellCoin(value, coin.symbol);
        if (res.error) {
            toast.error(res.error);
            return;
        }

        await getUser();
        await getCoinBySymbol(coin.symbol);
        const actualValue = res.totalValue ?? usdValue;
        toast.success(`Successfully sold ${value.toLocaleString()} ${coin.symbol.toUpperCase()} for $${actualValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`);
        setAmount("");
        setIsOpen(false);
        onSuccess?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md p-6">
                <DialogHeader>
                    <DialogTitle>Sell {coin.name}</DialogTitle>
                    <DialogDescription>
                        Enter the amount of {coin.symbol.toUpperCase()} tokens you want to sell.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Amount ({coin.symbol.toUpperCase()})</label>
                            <span className="text-xs text-muted-foreground">
                                Available: {userHoldings.toLocaleString()} {coin.symbol.toUpperCase()}
                            </span>
                        </div>
                        <div className="relative">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9 pr-16"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => setAmount(userHoldings.toString())}
                            >
                                Max
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current price</span>
                            <span className="font-mono">${coin.price?.toFixed(6) ?? "0.000000"} per {coin.symbol?.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">You'll receive</span>
                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    ~${usdValue > 0 ? usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </div>
                                <div className="text-xs text-muted-foreground">USD</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSell}
                        className="w-full bg-red-800 hover:bg-red-700 text-white text-sm px-6 py-6 rounded-lg cursor-pointer"
                    >
                        Confirm Sale
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
