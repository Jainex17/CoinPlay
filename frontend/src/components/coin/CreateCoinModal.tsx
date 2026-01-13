import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCoinStore } from "@/store/CoinStore";
import { useAuthStore } from "@/store/AuthStore";
import { Plus, Coins } from "lucide-react";
import { toast } from "sonner";

const CreateCoinModal = () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState("");
    const [symbolError, setSymbolError] = useState("");

    const { createCoin } = useCoinStore();
    const { user } = useAuthStore();

    const COIN_COST = 1000;
    const MIN_BALANCE = COIN_COST;

    const validateName = (value: string) => {
        if (!value.trim()) {
            return "Name is required";
        }
        if (value.length < 2) {
            return "Name must be at least 2 characters";
        }
        if (value.length > 50) {
            return "Name must be less than 50 characters";
        }
        return "";
    };

    const validateSymbol = (value: string) => {
        if (!value.trim()) {
            return "Symbol is required";
        }
        if (value.length < 3) {
            return "Symbol must be at least 3 characters";
        }
        if (value.length > 6) {
            return "Symbol must be at most 6 characters";
        }
        if (!/^[A-Za-z0-9]+$/.test(value)) {
            return "Symbol must be alphanumeric";
        }
        return "";
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        setNameError(validateName(value));
    };

    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        setSymbol(value);
        setSymbolError(validateSymbol(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nameErrorVal = validateName(name);
        const symbolErrorVal = validateSymbol(symbol);

        if (nameErrorVal || symbolErrorVal) {
            setNameError(nameErrorVal);
            setSymbolError(symbolErrorVal);
            return;
        }

        if (!user || user.balance < MIN_BALANCE) {
            toast.error(`Need $${MIN_BALANCE} balance to create a coin`);
            return;
        }

        setLoading(true);

        const result = await createCoin(name.trim(), symbol);

        if (result.success) {
            toast.success(`Successfully created ${symbol}!`);
            setOpen(false);
            setName("");
            setSymbol("");
        } else {
            toast.error(result.error || "Failed to create coin");
        }

        setLoading(false);
    };

    const hasEnoughBalance = user && user.balance >= MIN_BALANCE;
    const isFormValid = name.trim() && symbol.length >= 3 && symbol.length <= 6 && /^[A-Z0-9]+$/.test(symbol);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="gap-2 cursor-pointer"
                    disabled={!hasEnoughBalance}
                >
                    <Plus className="w-4 h-4" />
                    Create Coin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Coins className="w-5 h-5" />
                        Create New Coin
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cost to create:</span>
                            <span className="font-semibold">${COIN_COST}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your balance:</span>
                            <span className={`font-semibold ${hasEnoughBalance ? "text-green-500" : "text-red-500"}`}>
                                ${user?.balance?.toLocaleString() || 0}
                            </span>
                        </div>
                        {!hasEnoughBalance && (
                            <p className="text-xs text-red-500">
                                You need ${MIN_BALANCE} balance to create a coin
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Coin Name
                            </label>
                            <Input
                                id="name"
                                placeholder="e.g. Bitcoin"
                                value={name}
                                onChange={handleNameChange}
                                disabled={loading}
                                maxLength={50}
                            />
                            {nameError && (
                                <p className="text-xs text-red-500">{nameError}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="symbol" className="text-sm font-medium">
                                Coin Symbol
                            </label>
                            <Input
                                id="symbol"
                                placeholder="e.g. BTC"
                                value={symbol}
                                onChange={handleSymbolChange}
                                disabled={loading}
                                maxLength={6}
                                className="uppercase"
                            />
                            {symbolError && (
                                <p className="text-xs text-red-500">{symbolError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                3-6 alphanumeric characters (auto-capitalized)
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !isFormValid || !hasEnoughBalance}
                        >
                            {loading ? "Creating..." : `Create Coin ($${COIN_COST})`}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCoinModal;
