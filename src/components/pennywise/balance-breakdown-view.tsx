
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Landmark, Combine } from "lucide-react";

interface BalanceBreakdownViewProps {
  walletBalance: number;
  bankBalance: number;
  isClient: boolean;
}

export function BalanceBreakdownView({ walletBalance, bankBalance, isClient }: BalanceBreakdownViewProps) {
  const totalNetBalance = walletBalance + bankBalance;
  const loadingPlaceholder = "₹0.00"; // Consistent placeholder

  return (
    <Card className="shadow-lg mb-6 md:mb-8">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-2xl font-bold font-headline">Balance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 md:p-6 md:pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-sm font-medium font-headline">Wallet Balance</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-primary-foreground bg-primary p-3 rounded-md text-center">
              {isClient ? formatCurrency(walletBalance) : loadingPlaceholder}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-sm font-medium font-headline">Bank Balance</CardTitle>
            <Landmark className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-accent-foreground bg-accent p-3 rounded-md text-center">
              {isClient ? formatCurrency(bankBalance) : loadingPlaceholder}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-sm font-medium font-headline">Total Net Balance</CardTitle>
            <Combine className="h-5 w-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
            <div className={`text-xl md:text-2xl font-bold ${totalNetBalance >= 0 || !isClient ? 'text-green-100' : 'text-red-100'} ${totalNetBalance >= 0 || !isClient ? 'bg-green-600' : 'bg-red-600'} p-3 rounded-md text-center`}>
              {isClient ? formatCurrency(totalNetBalance) : loadingPlaceholder}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
