
"use client";

import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateTotal, filterTransactionsByPeriod, formatCurrency, formatDate, filterTransactionsByCustomRange } from "@/lib/utils";
import type { IncomeEntry, ExpenseEntry } from "@/lib/types";
import type { ActivePeriodType } from '@/app/page';
import { TrendingUp, TrendingDown, DollarSign, CalendarDays, Menu } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface PeriodSummaryCardProps {
  period: ActivePeriodType;
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  referenceDate: Date | null;
  customStartDate?: Date | null;
  customEndDate?: Date | null;
}

function PeriodSummaryCard({ period, income, expenses, referenceDate, customStartDate, customEndDate }: PeriodSummaryCardProps) {
  const totalIncome = calculateTotal(income);
  const totalExpenses = calculateTotal(expenses);
  const netBalance = totalIncome - totalExpenses;

  const chartData = useMemo(() => {
    let label = "";
     if (period === 'allTime') {
        label = "All Time";
    } else if (period === 'custom') {
        if (customStartDate && customEndDate && isValid(customStartDate) && isValid(customEndDate)) {
            label = `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d, yy")}`;
        } else {
            label = "Custom Range";
        }
    } else if (!referenceDate || !(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
        return [{ name: "Loading...", income: 0, expenses: 0 }];
    } else if (period === 'daily') {
        label = referenceDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
        const startOfWeekDate = new Date(referenceDate);
        startOfWeekDate.setDate(referenceDate.getDate() - referenceDate.getDay() + (referenceDate.getDay() === 0 ? -6 : 1)); // Adjust to Monday
        label = `Week of ${startOfWeekDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } else if (period === 'monthly') {
        label = referenceDate.toLocaleDateString(undefined, { month: 'long' });
    } else if (period === 'yearly') {
        label = referenceDate.getFullYear().toString();
    } else {
        label = period.charAt(0).toUpperCase() + period.slice(1);
    }
    return [{ name: label, income: totalIncome, expenses: totalExpenses }];
  }, [period, totalIncome, totalExpenses, referenceDate, customStartDate, customEndDate]);

  const cardTitleLabel = useMemo(() => {
    if (period === 'allTime') return "All Time Financial Overview";
    if (period === 'custom') {
      if (customStartDate && customEndDate && isValid(customStartDate) && isValid(customEndDate)) {
        return `Overview for ${formatDate(customStartDate.toISOString())} - ${formatDate(customEndDate.toISOString())}`;
      }
      return "Custom Range Overview (Select Dates)";
    }
    if (!referenceDate || !(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) return "Overview (Loading Date...)";

    switch(period) {
      case 'daily': return `Daily Overview for ${formatDate(referenceDate.toISOString())}`;
      case 'weekly':
        const startOfWeekDate = new Date(referenceDate);
        startOfWeekDate.setDate(referenceDate.getDate() - referenceDate.getDay() + (referenceDate.getDay() === 0 ? -6 : 1));
        return `Weekly Overview (Week of ${formatDate(startOfWeekDate.toISOString())})`;
      case 'monthly': return `Monthly Overview for ${referenceDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
      case 'yearly': return `Yearly Overview for ${referenceDate.getFullYear()}`;
      default: return `${period.charAt(0).toUpperCase() + period.slice(1)} Overview`;
    }
  }, [period, referenceDate, customStartDate, customEndDate]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-sm font-medium font-headline">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-sm font-medium font-headline">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-sm font-medium font-headline">Net Balance</CardTitle>
          <DollarSign className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(netBalance)}
          </div>
        </CardContent>
      </Card>

      { (totalIncome > 0 || totalExpenses > 0) && (
        <Card className="md:col-span-3 shadow-lg">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg font-medium font-headline">{cardTitleLabel}</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full p-4 pt-0 md:p-6 md:pt-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SummaryViewProps {
  allIncomeEntries: IncomeEntry[];
  allExpenseEntries: ExpenseEntry[];
  activePeriod: ActivePeriodType;
  onActivePeriodChange: (period: ActivePeriodType) => void;
  referenceDate: Date | null;
  customStartDate: Date | null;
  customEndDate: Date | null;
  customRangeIncome: IncomeEntry[];
  customRangeExpenses: ExpenseEntry[];
}

const periodTabItems: { value: ActivePeriodType; label: string | ReactNode }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: <span className="flex items-center"><CalendarDays className="mr-1 h-4 w-4" /> Custom</span> },
  { value: 'allTime', label: 'All Time' },
];

export function SummaryView({
  allIncomeEntries,
  allExpenseEntries,
  activePeriod,
  onActivePeriodChange,
  referenceDate,
  customStartDate,
  customEndDate,
  customRangeIncome,
  customRangeExpenses,
}: SummaryViewProps) {
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dailyIncome = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allIncomeEntries, 'daily', referenceDate) : [],
    [allIncomeEntries, referenceDate]
  );
  const dailyExpenses = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allExpenseEntries, 'daily', referenceDate) : [],
    [allExpenseEntries, referenceDate]
  );

  const weeklyIncome = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allIncomeEntries, 'weekly', referenceDate) : [],
    [allIncomeEntries, referenceDate]
  );
  const weeklyExpenses = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allExpenseEntries, 'weekly', referenceDate) : [],
    [allExpenseEntries, referenceDate]
  );

  const monthlyIncome = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allIncomeEntries, 'monthly', referenceDate) : [],
    [allIncomeEntries, referenceDate]
  );
  const monthlyExpenses = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allExpenseEntries, 'monthly', referenceDate) : [],
    [allExpenseEntries, referenceDate]
  );

  const yearlyIncome = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allIncomeEntries, 'yearly', referenceDate) : [],
    [allIncomeEntries, referenceDate]
  );
  const yearlyExpenses = useMemo(
    () => referenceDate ? filterTransactionsByPeriod(allExpenseEntries, 'yearly', referenceDate) : [],
    [allExpenseEntries, referenceDate]
  );

  const currentPeriodLabel = useMemo(() => {
    const currentItem = periodTabItems.find(item => item.value === activePeriod);
    if (currentItem) {
        if (typeof currentItem.label === 'string') return currentItem.label;
        // Simplified for dropdown display when label is ReactNode
        if (currentItem.value === 'custom') return 'Custom'; 
    }
    return 'Select Period';
  }, [activePeriod]);


  return (
    <Card className="w-full shadow-lg mb-6 md:mb-8">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-2xl font-bold font-headline">Financial Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
        <Tabs
          value={activePeriod}
          onValueChange={(value) => {
            if (typeof onActivePeriodChange === 'function') {
              onActivePeriodChange(value as ActivePeriodType);
            } else {
              console.error("SummaryView: onActivePeriodChange is not a function prop. Received:", onActivePeriodChange);
            }
          }}
        >
          <div className="mb-6">
            {isClient && isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full font-headline flex items-center justify-center text-base py-2.5 h-auto">
                    <Menu className="mr-2 h-5 w-5" />
                    <span>
                        {currentPeriodLabel}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width)-2px)] sm:w-64" align="start">
                  {periodTabItems.map((tab) => (
                    <DropdownMenuItem 
                      key={tab.value} 
                      onSelect={() => onActivePeriodChange(tab.value)}
                      className={cn("font-headline py-2 text-sm", activePeriod === tab.value && "bg-accent text-accent-foreground")}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <TabsList className="h-auto grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                {periodTabItems.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="font-headline">
                        {tab.label}
                    </TabsTrigger>
                ))}
              </TabsList>
            )}
          </div>
          
          <TabsContent value="daily">
            <PeriodSummaryCard period="daily" income={dailyIncome} expenses={dailyExpenses} referenceDate={referenceDate} />
          </TabsContent>
          <TabsContent value="weekly">
            <PeriodSummaryCard period="weekly" income={weeklyIncome} expenses={weeklyExpenses} referenceDate={referenceDate} />
          </TabsContent>
          <TabsContent value="monthly">
            <PeriodSummaryCard period="monthly" income={monthlyIncome} expenses={monthlyExpenses} referenceDate={referenceDate} />
          </TabsContent>
          <TabsContent value="yearly">
            <PeriodSummaryCard period="yearly" income={yearlyIncome} expenses={yearlyExpenses} referenceDate={referenceDate} />
          </TabsContent>
          <TabsContent value="custom">
            <PeriodSummaryCard
                period="custom"
                income={customRangeIncome}
                expenses={customRangeExpenses}
                referenceDate={referenceDate}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
            />
          </TabsContent>
          <TabsContent value="allTime">
            <PeriodSummaryCard period="allTime" income={allIncomeEntries} expenses={allExpenseEntries} referenceDate={referenceDate} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

