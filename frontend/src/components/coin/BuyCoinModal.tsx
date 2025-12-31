import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { useCoinStore, type CoinType } from "@/store/CoinStore";
import { usePortfolioStore } from "@/store/PortfolioStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";

interface BuyCoinModalProps {
    coin: CoinType;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const BuyCoinModal = ({ coin, isOpen, setIsOpen }: BuyCoinModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [tokens, setTokens] = useState<number>(0);
    const { publicPortfolio } = usePortfolioStore();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { buyCoin, getCoinBySymbol } = useCoinStore();

    useEffect(() => {
        const value = parseFloat(amount);
        if (!isNaN(value) && coin.price > 0) {
            setTokens(value / coin.price);
        } else {
            setTokens(0);
        }
    }, [amount, coin.price]);

    const handleBuy = async () => {
        const value = parseFloat(amount);
        if (!user) {
            toast.error("Please login to buy coins");
            return;
        }

        if (isNaN(value) || value <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (publicPortfolio && value > publicPortfolio.balance) {
            toast.error("Insufficient balance");
            return;
        }

        const res = await buyCoin(value, coin.symbol);
        if (res.error) {
            toast.error(res.error);
            return;
        }

        getCoinBySymbol(coin.symbol);
        toast.success(`Successfully bought ${coin.symbol.toUpperCase()} for $${value}!`);
        setIsOpen(false);
    };

    const handleClose = () => {
        setIsOpen(false);
        navigate(`/coin/${coin.symbol}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-6">
                <DialogHeader>
                    <DialogTitle>Buy {coin.name}</DialogTitle>
                    <DialogDescription>
                        Enter the amount of USD you want to spend to receive {coin.symbol.toUpperCase()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Amount (USD)</label>
                            <span className="text-xs text-muted-foreground">
                                Balance: ${user?.balance?.toLocaleString() ?? "0.00"}
                            </span>
                        </div>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per token</span>
                            <span className="font-mono">${coin.price.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">You receive</span>
                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    {tokens > 0 ? tokens.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0.00"}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleBuy}
                        className="w-full bg-red-800 hover:bg-red-700 text-white text-sm px-6 py-6 rounded-lg cursor-pointer"
                    >
                        Confirm Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
