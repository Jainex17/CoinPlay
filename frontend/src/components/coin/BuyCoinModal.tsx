import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";
import { useCoinStore, type CoinType } from "@/store/CoinStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";

interface BuyCoinModalProps {
    coin: CoinType;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSuccess?: () => void;
}

export const BuyCoinModal = ({ coin, isOpen, setIsOpen, onSuccess }: BuyCoinModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [tokens, setTokens] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, getUser } = useAuthStore();
    const { buyCoin } = useCoinStore();

    useEffect(() => {
        const value = parseFloat(amount);
        if (coin.pricing_model === "reference" && Number.isFinite(value) && value > 0 && coin.price > 0) {
            setTokens(Math.floor((value / coin.price + Number.EPSILON) * 100_000_000) / 100_000_000);
            return;
        }
        if (!isNaN(value) && value > 0 && coin.tokenReserve > 0 && coin.baseReserve > 0) {
            const k = coin.tokenReserve * coin.baseReserve;
            const newBaseReserve = coin.baseReserve + value;
            const newTokenReserve = k / newBaseReserve;
            const tokensOut = coin.tokenReserve - newTokenReserve;
            setTokens(Math.floor(tokensOut));
        } else {
            setTokens(0);
        }
    }, [amount, coin.price, coin.pricing_model, coin.tokenReserve, coin.baseReserve]);

    const handleBuy = async () => {
        if (submitting) return;
        const value = Number(amount);
        if (!user) {
            toast.error("Please login to buy coins");
            return;
        }

        if (!Number.isFinite(value) || value < 0.01) {
            toast.error("Please enter a valid dollar amount (minimum $0.01)");
            return;
        }

        if (user && value > user.balance) {
            toast.error("Insufficient balance");
            return;
        }

        setSubmitting(true);
        try {
            const res = await buyCoin(value, coin.symbol);
            if (res.error) {
                toast.error(res.error);
                return;
            }

            toast.success(`Successfully bought ${coin.symbol.toUpperCase()} for $${value}!`);
            await getUser();
            setIsOpen(false);
            onSuccess?.();
        } finally {
            setSubmitting(false);
        }
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
                                placeholder="0"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*(?:\.\d{0,2})?$/.test(val)) setAmount(val);
                                }}
                                className="pl-9 pr-16"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => setAmount(user?.balance?.toString() ?? "0")}
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
                            <span className="font-medium">{coin.symbol?.toUpperCase()} you'll get</span>
                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    ~{tokens > 0 ? tokens.toLocaleString() : "0"}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleBuy}
                        disabled={submitting}
                        className="w-full bg-red-800 hover:bg-red-700 text-white text-sm px-6 py-6 rounded-lg cursor-pointer"
                    >
                        Confirm Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
