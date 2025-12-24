import { useAuthStore } from "@/store/AuthStore";
import { usePortfolioStore } from "@/store/PortfolioStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CalendarDays
} from "lucide-react";
import { useEffect } from "react";
import { LoginBox } from "./LoginBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Portfolio = () => {
  const { user } = useAuthStore();
  const { portfolio, getUserPortfolio } = usePortfolioStore();

  useEffect(() => {
    if (user) {
      getUserPortfolio();
    }
  }, [user]);

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

  if (!user) {
    return (
      <LoginBox />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                referrerPolicy="no-referrer"
                alt={user.name}
              />
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Joined {formatDate(user.created_at)}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(portfolio.cash)}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Available for betting
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claimed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(portfolio.claimed_cash)}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Lifetime claimed amount
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(portfolio.cash)}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Total portfolio value
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent betting history</CardDescription>
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
              {portfolio.bets && portfolio.bets.length > 0 ? (
                portfolio.bets.map((bet, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatCurrency(bet.bet_amount)}</TableCell>
                    <TableCell>
                      <span className={bet.bet_result === 'win' ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                        {bet.bet_result.charAt(0).toUpperCase() + bet.bet_result.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{bet.created_at && new Date(bet.created_at).toLocaleDateString() || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                    No bets placed yet
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
