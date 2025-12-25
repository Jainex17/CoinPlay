import { usePortfolioStore } from "@/store/PortfolioStore";
import { useAuthStore } from "@/store/AuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LoginBox } from "./LoginBox";
import {
    Wallet,
    TrendingUp,
    DollarSign,
    CalendarDays,
    User,
    Loader2,
    UserX
} from "lucide-react";
import { useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useParams, Link } from "react-router-dom";

export const UserPortfolio = () => {
    const { getUserPortfolioByUsername, publicPortfolio, isPublicPortfolioLoading } = usePortfolioStore();
    const { user: authUser } = useAuthStore();
    const { username } = useParams<{ username: string }>();

    useEffect(() => {
        if (username) {
            getUserPortfolioByUsername(username);
        }
    }, [username]);

    // If no username in URL and user is not logged in, show login box
    if (!username && !authUser) {
        return <LoginBox />;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 7
        }).format(amount);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Never';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long'
        }).format(new Date(date));
    };

    if (isPublicPortfolioLoading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 min-h-[60vh]">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full animate-pulse" />
                    <Loader2 className="h-16 w-16 text-blue-400 animate-spin relative z-10" />
                </div>
                <p className="text-muted-foreground text-lg animate-pulse">Loading portfolio...</p>
            </div>
        );
    }

    if (!publicPortfolio) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 min-h-[60vh]">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full" />
                    <div className="relative z-10 p-8 rounded-full border border-red-500/20">
                        <UserX className="h-20 w-20 text-red-400" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">User Not Found</h2>
                    <p className="text-muted-foreground">
                        The user <span className="text-red-400 font-mono">@{username}</span> doesn't exist or has no portfolio.
                    </p>
                </div>
                <Link
                    to="/"
                    className="px-6 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-white font-medium"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    const { user, cash, claimed_cash, bets } = publicPortfolio;

    const totalBets = bets?.length || 0;
    const totalWins = bets?.filter(bet => bet.bet_result === 'win').length || 0;
    const winRate = totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : '0';
    const totalWagered = bets?.reduce((sum, bet) => sum + parseInt(bet.bet_amount), 0) || 0;
    console.log(totalBets, totalWins, winRate, totalWagered);

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <Card className="w-full overflow-hidden relative">
                <div className="absolute inset-0" />
                <CardHeader className="relative z-10">
                    <div className="flex items-center space-x-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 relative border-2 border-white/20">
                                <AvatarImage
                                    src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                    referrerPolicy="no-referrer"
                                    alt={user.name}
                                />
                                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                {user.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-blue-400">
                                <User className="h-4 w-4" />
                                <span className="font-mono">@{user.username}</span>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                <span>Joined {formatDate(user.created_at)}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="gap-3 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash</CardTitle>
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <Wallet className="h-4 w-4 text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">
                            {formatCurrency(cash)}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Current balance
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="gap-3 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Claimed</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">
                            {formatCurrency(claimed_cash)}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Lifetime claimed amount
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="gap-3 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
                        <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                            <DollarSign className="h-4 w-4 text-yellow-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-400">
                            {formatCurrency(totalWagered)}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            From {totalBets} total bets
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="gap-3 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-400">
                            {winRate}%
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            {totalWins} wins / {totalBets - totalWins} losses
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Betting history for @{user.username}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bets && bets.length > 0 ? (
                                bets.slice(0, 10).map((bet, index) => (
                                    <TableRow key={index} className="group">
                                        <TableCell className="font-mono">{formatCurrency(parseInt(bet.bet_amount))}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bet.bet_result === 'win'
                                                ? "text-green-400"
                                                : "text-red-400"
                                                }`}>
                                                {bet.bet_result === 'win' ? 'Win' : 'Lose'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {bet.created_at && new Date(bet.created_at).toLocaleDateString() || 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        <div className="flex flex-col items-center gap-2">
                                            <DollarSign className="h-8 w-8 opacity-50" />
                                            <span>No bets placed yet</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
