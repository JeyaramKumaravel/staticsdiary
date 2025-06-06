

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { StaticsDiaryLogo } from "@/components/icons/staticsdiary-logo";
import { IncomeForm } from "@/components/pennywise/income-form";
import { ExpenseForm } from "@/components/pennywise/expense-form";
import { TransferForm } from "@/components/pennywise/transfer-form";
import { TransactionList } from "@/components/pennywise/transaction-list";
import { SummaryView } from "@/components/pennywise/summary-view";
import { BalanceBreakdownView } from "@/components/pennywise/balance-breakdown-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExpenseCategoryPieChart } from "@/components/pennywise/expense-category-pie-chart";
import { IncomeSourcePieChart } from "@/components/pennywise/income-source-pie-chart";
import { ExpenseCategoryBarChart } from "@/components/pennywise/expense-category-bar-chart";
import { IncomeSourceBarChart } from "@/components/pennywise/income-source-bar-chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download, Upload, AlertTriangle, Inbox, ArrowLeft, Menu, Repeat } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, calculateTotal } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid,
  getYear,
  startOfDay,
  startOfYear,
} from "date-fns";
import {
  filterTransactionsBySpecificMonth,
  filterTransactionsBySpecificYear,
  filterTransactionsByPeriod,
  filterTransactionsByCustomRange,
} from "@/lib/utils";
import type { IncomeEntry, ExpenseEntry, TransferEntry, TransactionType } from "@/lib/types";
import type { SortOption } from "@/components/pennywise/transaction-list";
import { useToast } from "@/hooks/use-toast";

export type ActivePeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'allTime' | 'custom';

const overviewTabDropdownTriggerStyles = "w-full sm:w-auto sm:min-w-[220px]";

const tabItems = [
  { value: 'overview', label: 'Overview' },
  { value: 'income', label: 'Manage Income' },
  { value: 'expenses', label: 'Manage Expenses' },
  { value: 'transfers', label: 'Manage Transfers' },
  { value: 'data', label: 'Data Management' },
];

export default function HomePage() {
  const { incomeEntries, expenseEntries, transferEntries, replaceAllIncome, replaceAllExpenses, replaceAllTransfers } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activePeriod, setActivePeriod] = useState<ActivePeriodType>('monthly');
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [isCustomStartDatePickerOpen, setIsCustomStartDatePickerOpen] = useState(false);
  const [isCustomEndDatePickerOpen, setIsCustomEndDatePickerOpen] = useState(false);

  const [incomeSortOption, setIncomeSortOption] = useState<SortOption>('date_desc');
  const [expenseSortOption, setExpenseSortOption] = useState<SortOption>('date_desc');
  const [transferSortOption, setTransferSortOption] = useState<SortOption>('date_desc');
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  const [expenseChartDisplayLevel, setExpenseChartDisplayLevel] = useState<'category' | 'subcategory'>('category');
  const [selectedParentExpenseCategory, setSelectedParentExpenseCategory] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (!selectedDate) setSelectedDate(new Date());
    if (!customStartDate) setCustomStartDate(startOfMonth(new Date()));
    if (!customEndDate) setCustomEndDate(endOfMonth(new Date()));
  }, []);


  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
      setIsCustomStartDatePickerOpen(false);
      setIsCustomEndDatePickerOpen(false);
      setExpenseChartDisplayLevel('category');
      setSelectedParentExpenseCategory(null);
    }
  };

  const handleTransactionDateNavigation = (dateString: string, type: TransactionType) => {
    const transactionDate = parseISO(dateString);
    if (isValid(transactionDate)) {
      setSelectedDate(transactionDate);
      let targetTab = type === 'income' ? 'income' : (type === 'expense' ? 'expenses' : 'transfers');
      setCurrentTab(targetTab);
      
      if (type === 'expense') {
        setExpenseChartDisplayLevel('category');
        setSelectedParentExpenseCategory(null);
      }

      if (currentTab !== targetTab) {
        // Tab will change, calendar state might be handled by tab's own logic
      } else {
         setIsCalendarOpen(true); // Open calendar if already on the correct tab
      }
      setIsCustomStartDatePickerOpen(false);
      setIsCustomEndDatePickerOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Invalid date for navigation.",
      });
    }
  };


  const currentMonthYear = useMemo(() => {
    if (!isClient || !selectedDate) return "Loading date...";
    return format(selectedDate, "MMMM yyyy");
  }, [selectedDate, isClient]);

  const filteredIncomeForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(incomeEntries, selectedDate) : [],
    [incomeEntries, selectedDate]
  );
  const filteredExpensesForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(expenseEntries, selectedDate) : [],
    [expenseEntries, selectedDate]
  );
  const filteredTransfersForMonth = useMemo(
    () => selectedDate ? filterTransactionsBySpecificMonth(transferEntries, selectedDate) : [],
    [transferEntries, selectedDate]
  );


  const incomeForSelectedYear = useMemo(
    () => selectedDate ? filterTransactionsBySpecificYear(incomeEntries, selectedDate) : [],
    [incomeEntries, selectedDate]
  );
  const expensesForSelectedYear = useMemo(
    () => selectedDate ? filterTransactionsBySpecificYear(expenseEntries, selectedDate) : [],
    [expenseEntries, selectedDate]
  );

  const customRangeIncome = useMemo(
    () => filterTransactionsByCustomRange(incomeEntries, customStartDate, customEndDate),
    [incomeEntries, customStartDate, customEndDate]
  );
  const customRangeExpenses = useMemo(
    () => filterTransactionsByCustomRange(expenseEntries, customStartDate, customEndDate),
    [expenseEntries, customStartDate, customEndDate]
  );

  const overviewIncomeToDisplay = useMemo(() => {
    if (!selectedDate && (activePeriod === 'daily' || activePeriod === 'weekly' || activePeriod === 'monthly' || activePeriod === 'yearly')) return [];
    switch (activePeriod) {
      case 'daily':
        return filterTransactionsByPeriod(incomeEntries, 'daily', selectedDate!);
      case 'weekly':
        return filterTransactionsByPeriod(incomeEntries, 'weekly', selectedDate!);
      case 'monthly':
        return filteredIncomeForMonth;
      case 'yearly':
        return incomeForSelectedYear;
      case 'custom':
        return customRangeIncome;
      case 'allTime':
        return incomeEntries;
      default:
        return filteredIncomeForMonth;
    }
  }, [activePeriod, incomeEntries, filteredIncomeForMonth, incomeForSelectedYear, selectedDate, customRangeIncome]);

  const overviewExpensesToDisplay = useMemo(() => {
    if (!selectedDate && (activePeriod === 'daily' || activePeriod === 'weekly' || activePeriod === 'monthly' || activePeriod === 'yearly')) return [];
    switch (activePeriod) {
      case 'daily':
        return filterTransactionsByPeriod(expenseEntries, 'daily', selectedDate!);
      case 'weekly':
        return filterTransactionsByPeriod(expenseEntries, 'weekly', selectedDate!);
      case 'monthly':
        return filteredExpensesForMonth;
      case 'yearly':
        return expensesForSelectedYear;
      case 'custom':
        return customRangeExpenses;
      case 'allTime':
        return expenseEntries;
      default:
        return filteredExpensesForMonth;
    }
  }, [activePeriod, expenseEntries, filteredExpensesForMonth, expensesForSelectedYear, selectedDate, customRangeExpenses]);


  const uniqueIncomeSegmentsCount = useMemo(() => {
    if (!overviewIncomeToDisplay || overviewIncomeToDisplay.length === 0) return 0;
    const sources = new Set<string>();
    overviewIncomeToDisplay.forEach(entry => sources.add(entry.source));
    return sources.size;
  }, [overviewIncomeToDisplay]);

  const expensesToDisplayInDrilldownChart = useMemo(() => {
    if (expenseChartDisplayLevel === 'subcategory' && selectedParentExpenseCategory) {
      return overviewExpensesToDisplay.filter(e => e.category === selectedParentExpenseCategory);
    }
    return overviewExpensesToDisplay;
  }, [overviewExpensesToDisplay, expenseChartDisplayLevel, selectedParentExpenseCategory]);

  const uniqueSegmentsForCurrentExpenseView = useMemo(() => {
    if (!expensesToDisplayInDrilldownChart || expensesToDisplayInDrilldownChart.length === 0) return 0;
    const segments = new Set<string>();
    expensesToDisplayInDrilldownChart.forEach(entry => {
      segments.add(expenseChartDisplayLevel === 'category' ? entry.category : (entry.subcategory || '(No Subcategory)'));
    });
    return segments.size;
  }, [expensesToDisplayInDrilldownChart, expenseChartDisplayLevel]);


  const overviewListTitle = useMemo(() => {
    if (!isClient && activePeriod !== 'allTime' && activePeriod !== 'custom') return "for loading date...";
    if (!selectedDate && activePeriod !== 'allTime' && activePeriod !== 'custom') return "for loading date...";

    let refDateForLabel = selectedDate;
    if (activePeriod === 'weekly' && selectedDate) refDateForLabel = startOfWeek(selectedDate, { weekStartsOn: 1 });
    if (activePeriod === 'monthly' && selectedDate) refDateForLabel = startOfMonth(selectedDate);
    if (activePeriod === 'yearly' && selectedDate) refDateForLabel = startOfYear(selectedDate);

    switch (activePeriod) {
      case 'daily':
        return `for ${format(refDateForLabel!, "MMMM d, yyyy")}`;
      case 'weekly':
        const weekStart = startOfWeek(refDateForLabel!, { weekStartsOn: 1 });
        return `for Week of ${format(weekStart, "MMMM d")}`;
      case 'monthly':
        return `for ${format(refDateForLabel!, "MMMM yyyy")}`;
      case 'yearly':
        return `for ${format(refDateForLabel!, "yyyy")}`;
      case 'custom':
        if (customStartDate && customEndDate) {
          return `for ${format(customStartDate, "MMM d, yyyy")} - ${format(customEndDate, "MMM d, yyyy")}`;
        }
        return 'for Custom Range (select dates)';
      case 'allTime':
        return `for All Time`;
      default:
        return selectedDate ? `for ${format(refDateForLabel!, "MMMM yyyy")}` : "for loading date...";
    }
  }, [activePeriod, selectedDate, customStartDate, customEndDate, isClient]);

  const expenseChartTitle = useMemo(() => {
    if (expenseChartDisplayLevel === 'subcategory' && selectedParentExpenseCategory) {
      return `Expense Subcategories for ${selectedParentExpenseCategory} ${overviewListTitle}`;
    }
    return `Expense Breakdown ${overviewListTitle}`;
  }, [expenseChartDisplayLevel, selectedParentExpenseCategory, overviewListTitle]);

  const handleExpenseCategoryChartClick = (categoryName: string) => {
    if (expenseChartDisplayLevel === 'category') {
      setSelectedParentExpenseCategory(categoryName);
      setExpenseChartDisplayLevel('subcategory');
    }
  };

  const handleBackToCategories = () => {
    setExpenseChartDisplayLevel('category');
    setSelectedParentExpenseCategory(null);
  };


  const handleExportData = () => {
    const dataToExport = {
      incomeEntries,
      expenseEntries,
      transferEntries, // Added transfers
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staticsdiary_backup_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Data Exported",
      description: "Your data has been successfully downloaded.",
    });
  };

  const isValidIncomeEntry = (entry: any): entry is IncomeEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' &&
      (entry.source === 'wallet' || entry.source === 'bank') &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.subcategory === undefined || typeof entry.subcategory === 'string') &&
      (entry.description === undefined || typeof entry.description === 'string')
    );
  };

  const isValidExpenseEntry = (entry: any): entry is ExpenseEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' &&
      typeof entry.category === 'string' && entry.category.length > 0 &&
      (entry.subcategory === undefined || typeof entry.subcategory === 'string') &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.description === undefined || typeof entry.description === 'string') &&
      (entry.source === 'wallet' || entry.source === 'bank')
    );
  };

  const isValidTransferEntry = (entry: any): entry is TransferEntry => {
    return (
      typeof entry.id === 'string' &&
      typeof entry.amount === 'number' && entry.amount > 0 &&
      (entry.fromSource === 'wallet' || entry.fromSource === 'bank') &&
      (entry.toSource === 'wallet' || entry.toSource === 'bank') &&
      entry.fromSource !== entry.toSource &&
      typeof entry.date === 'string' && isValid(parseISO(entry.date)) &&
      (entry.description === undefined || typeof entry.description === 'string')
    );
  };


  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "No file selected.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (
          !data ||
          typeof data !== 'object' ||
          !Array.isArray(data.incomeEntries) ||
          !Array.isArray(data.expenseEntries) ||
          !Array.isArray(data.transferEntries) // Added check for transfers
        ) {
          throw new Error("Invalid file structure. Expected 'incomeEntries', 'expenseEntries', and 'transferEntries' arrays.");
        }

        const allIncomeValid = data.incomeEntries.every(isValidIncomeEntry);
        const allExpensesValid = data.expenseEntries.every(isValidExpenseEntry);
        const allTransfersValid = data.transferEntries.every(isValidTransferEntry);


        if (!allIncomeValid) {
          throw new Error("Invalid data in 'incomeEntries'. Please check the file format and content.");
        }
        if (!allExpensesValid) {
          throw new Error("Invalid data in 'expenseEntries'. Please check the file format and content.");
        }
        if (!allTransfersValid) {
          throw new Error("Invalid data in 'transferEntries'. Please check the file format and content.");
        }


        const validatedIncomeEntries = data.incomeEntries.filter(isValidIncomeEntry).map((entry: IncomeEntry) => ({
          ...entry,
          date: parseISO(entry.date).toISOString(),
          subcategory: entry.subcategory || "",
        }));
        const validatedExpenseEntries = data.expenseEntries.filter(isValidExpenseEntry).map((entry: ExpenseEntry) => ({
          ...entry,
          date: parseISO(entry.date).toISOString(),
          subcategory: entry.subcategory || "",
          source: entry.source,
        }));
        const validatedTransferEntries = data.transferEntries.filter(isValidTransferEntry).map((entry: TransferEntry) => ({
            ...entry,
            date: parseISO(entry.date).toISOString(),
        }));


        const confirmed = window.confirm(
          "WARNING: Importing data will REPLACE all your current income, expense, and transfer entries. This action CANNOT be undone. Are you sure you want to proceed?"
        );

        if (confirmed) {
          replaceAllIncome(validatedIncomeEntries);
          replaceAllExpenses(validatedExpenseEntries);
          replaceAllTransfers(validatedTransferEntries); // Added replaceAllTransfers
          toast({
            title: "Import Successful",
            description: "Your data has been imported and replaced the existing data.",
          });
        } else {
          toast({
            title: "Import Cancelled",
            description: "Data import was cancelled by the user.",
          });
        }
      } catch (error: any) {
        console.error("Import error:", error);
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error.message || "The file is corrupted or not in the correct format. Please check the file and try again.",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };

  const calendarRangeYear = isClient && selectedDate ? getYear(selectedDate) : getYear(new Date());
  const calendarFromYear = calendarRangeYear - 10;
  const calendarToYear = calendarRangeYear + 10;

  // Calculate Wallet Balance
  const allTimeWalletIncome = useMemo(() => calculateTotal(incomeEntries.filter(e => e.source === 'wallet')), [incomeEntries]);
  const allTimeWalletExpenses = useMemo(() => calculateTotal(expenseEntries.filter(e => e.source === 'wallet')), [expenseEntries]);
  const totalTransferredFromWallet = useMemo(() => calculateTotal(transferEntries.filter(t => t.fromSource === 'wallet')), [transferEntries]);
  const totalTransferredToWallet = useMemo(() => calculateTotal(transferEntries.filter(t => t.toSource === 'wallet')), [transferEntries]);
  const walletBalance = useMemo(() => allTimeWalletIncome - allTimeWalletExpenses - totalTransferredFromWallet + totalTransferredToWallet, [allTimeWalletIncome, allTimeWalletExpenses, totalTransferredFromWallet, totalTransferredToWallet]);

  // Calculate Bank Balance
  const allTimeBankIncome = useMemo(() => calculateTotal(incomeEntries.filter(e => e.source === 'bank')), [incomeEntries]);
  const allTimeBankExpenses = useMemo(() => calculateTotal(expenseEntries.filter(e => e.source === 'bank')), [expenseEntries]);
  const totalTransferredFromBank = useMemo(() => calculateTotal(transferEntries.filter(t => t.fromSource === 'bank')), [transferEntries]);
  const totalTransferredToBank = useMemo(() => calculateTotal(transferEntries.filter(t => t.toSource === 'bank')), [transferEntries]);
  const bankBalance = useMemo(() => allTimeBankIncome - allTimeBankExpenses - totalTransferredFromBank + totalTransferredToBank, [allTimeBankIncome, allTimeBankExpenses, totalTransferredFromBank, totalTransferredToBank]);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 md:py-6 px-4 md:px-6 bg-card border-b border-border sticky top-0 z-40 card-shadow">
        <div className="container mx-auto flex items-center gap-2">
          <StaticsDiaryLogo className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">StaticsDiary</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 pt-6 md:pt-8">
        <Tabs defaultValue="overview" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="bg-card p-1 rounded-lg mb-4 md:mb-6 card-shadow">
            {isClient && isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full font-headline flex items-center justify-center text-base py-2.5 h-auto">
                    <Menu className="mr-2 h-5 w-5" />
                    <span>
                      {tabItems.find(tab => tab.value === currentTab)?.label || 'Menu'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width)-2px)] sm:w-64" align="start">
                  {tabItems.map((tab) => (
                    <DropdownMenuItem
                      key={tab.value}
                      onSelect={() => setCurrentTab(tab.value)}
                      className={cn("font-headline py-2 text-sm", currentTab === tab.value && "bg-accent text-accent-foreground")}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <TabsList className="h-auto grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
                 {tabItems.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="font-headline">
                    {tab.label}
                    </TabsTrigger>
                ))}
              </TabsList>
            )}
          </div>

          <TabsContent value="overview">
            <BalanceBreakdownView
              walletBalance={walletBalance}
              bankBalance={bankBalance}
              isClient={isClient}
            />
            {currentTab === 'overview' && activePeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 p-2 pt-0 md:p-4 md:pt-0 md:pb-4">
                <Popover open={isCustomStartDatePickerOpen} onOpenChange={setIsCustomStartDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {isClient && customStartDate ? format(customStartDate, "PPP") : <span>Start Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {isClient && (
                      <Calendar
                        mode="single"
                        selected={customStartDate ?? undefined}
                        onSelect={(date) => {
                          setCustomStartDate(date ?? null);
                          setIsCustomStartDatePickerOpen(false);
                          if (date && customEndDate && date > customEndDate) {
                            setCustomEndDate(null);
                          }
                        }}
                        disabled={(date) => (customEndDate ? date > customEndDate : false) || date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                      />
                    )}
                  </PopoverContent>
                </Popover>
                <Popover open={isCustomEndDatePickerOpen} onOpenChange={setIsCustomEndDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {isClient && customEndDate ? format(customEndDate, "PPP") : <span>End Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                     {isClient && (
                        <Calendar
                        mode="single"
                        selected={customEndDate ?? undefined}
                        onSelect={(date) => {
                            setCustomEndDate(date ?? null);
                            setIsCustomEndDatePickerOpen(false);
                        }}
                        disabled={(date) => (customStartDate ? date < customStartDate : false) || date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={calendarFromYear}
                        toYear={calendarToYear}
                        />
                     )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {currentTab === 'overview' && activePeriod !== 'allTime' && activePeriod !== 'custom' && (
                <div className="p-2 pt-0 md:p-4 md:pt-0 md:pb-4">
                <Popover open={isCalendarOpen && currentTab === 'overview'} onOpenChange={(isOpen) => currentTab === 'overview' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full md:w-[280px] justify-start text-left font-normal mb-4",
                        !selectedDate && "text-muted-foreground"
                        )}
                        disabled={activePeriod === 'allTime' || activePeriod === 'custom'}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isClient && selectedDate ? format(selectedDate, "dd-MM-yyyy") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        {isClient && (
                            <Calendar
                                mode="single"
                                selected={selectedDate ?? undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                                defaultMonth={selectedDate ?? undefined}
                                captionLayout="dropdown-buttons"
                                fromYear={calendarFromYear}
                                toYear={calendarToYear}
                            />
                        )}
                    </PopoverContent>
                </Popover>
                </div>
            )}

            <SummaryView
              allIncomeEntries={incomeEntries}
              allExpenseEntries={expenseEntries}
              activePeriod={activePeriod}
              onActivePeriodChange={(newPeriod) => {
                 setActivePeriod(newPeriod);
                 setExpenseChartDisplayLevel('category');
                 setSelectedParentExpenseCategory(null);
              }}
              referenceDate={selectedDate}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              customRangeIncome={customRangeIncome}
              customRangeExpenses={customRangeExpenses}
            />

            {overviewIncomeToDisplay.length === 0 && overviewExpensesToDisplay.length === 0 ? (
              <Card className="shadow-lg mt-6 md:mt-8">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activePeriod === 'allTime' && incomeEntries.length === 0 && expenseEntries.length === 0
                      ? "Welcome to StaticsDiary!"
                      : "No Transactions Yet"}
                  </h3>
                  <p className="text-muted-foreground">
                    {activePeriod === 'allTime' && incomeEntries.length === 0 && expenseEntries.length === 0
                      ? "Start by adding your income or expenses in the 'Manage' tabs."
                      : `There are no transactions for the selected period. Try adjusting the date or visit the 'Manage' tabs to add new entries.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
                {overviewIncomeToDisplay.length > 0 && (
                  <div>
                    {uniqueIncomeSegmentsCount <= 5 ? (
                      <IncomeSourcePieChart income={overviewIncomeToDisplay} title={`Income Breakdown ${overviewListTitle}`} onDateClick={handleTransactionDateNavigation} />
                    ) : (
                      <IncomeSourceBarChart income={overviewIncomeToDisplay} title={`Income Breakdown ${overviewListTitle}`} onDateClick={handleTransactionDateNavigation} />
                    )}
                  </div>
                )}

                 {overviewExpensesToDisplay.length > 0 && (
                    <div>
                        {expensesToDisplayInDrilldownChart.length > 0 ? (
                            <>
                                {uniqueSegmentsForCurrentExpenseView <= 5 ? (
                                    <ExpenseCategoryPieChart
                                        expenses={expensesToDisplayInDrilldownChart}
                                        title={expenseChartTitle}
                                        chartMode={expenseChartDisplayLevel}
                                        parentCategoryForSubcharts={selectedParentExpenseCategory || undefined}
                                        onCategoryClick={handleExpenseCategoryChartClick}
                                        onDateClick={handleTransactionDateNavigation}
                                        onBackToCategoriesClick={handleBackToCategories}
                                    />
                                ) : (
                                    <ExpenseCategoryBarChart
                                        expenses={expensesToDisplayInDrilldownChart}
                                        title={expenseChartTitle}
                                        chartMode={expenseChartDisplayLevel}
                                        parentCategoryForSubcharts={selectedParentExpenseCategory || undefined}
                                        onCategoryClick={handleExpenseCategoryChartClick}
                                        onDateClick={handleTransactionDateNavigation}
                                        onBackToCategoriesClick={handleBackToCategories}
                                    />
                                )}
                            </>
                        ) : (
                             <Card className="shadow-lg">
                                <CardHeader className="p-4 md:p-6">
                                <CardTitle className="font-headline text-xl md:text-2xl">{expenseChartTitle}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                <p className="text-muted-foreground text-sm md:text-base py-4 text-center">
                                    {selectedParentExpenseCategory ? `No subcategories found for ${selectedParentExpenseCategory}.` : `No expense data for this view.`}
                                </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

              </div>
            )}
          </TabsContent>

          <TabsContent value="income">
            <div className="p-2 pt-0 md:p-4 md:pt-0 md:pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && currentTab === 'income'} onOpenChange={(isOpen) => currentTab === 'income' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-auto sm:min-w-[280px] justify-start text-left font-normal"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isClient && selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                       {isClient && (
                            <Calendar
                                key={selectedDate ? `income-calendar-${selectedDate.toISOString()}` : 'no-date-income-tab'}
                                mode="single"
                                selected={selectedDate ?? undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                                defaultMonth={selectedDate ?? undefined}
                                captionLayout="dropdown-buttons"
                                fromYear={calendarFromYear}
                                toYear={calendarToYear}
                            />
                       )}
                    </PopoverContent>
                </Popover>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={incomeSortOption} onValueChange={(value) => setIncomeSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Add New Income</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <IncomeForm />
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Income History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                   <ScrollArea className="h-[250px] md:h-[350px] pr-2">
                    <TransactionList transactions={filteredIncomeForMonth} type="income" sortOption={incomeSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
             <div className="p-2 pt-0 md:p-4 md:pt-0 md:pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && currentTab === 'expenses'} onOpenChange={(isOpen) => currentTab === 'expenses' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-auto sm:min-w-[280px] justify-start text-left font-normal"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isClient && selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        {isClient && (
                            <Calendar
                                key={selectedDate ? `expense-calendar-${selectedDate.toISOString()}` : 'no-date-expenses-tab'}
                                mode="single"
                                selected={selectedDate ?? undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                                defaultMonth={selectedDate ?? undefined}
                                captionLayout="dropdown-buttons"
                                fromYear={calendarFromYear}
                                toYear={calendarToYear}
                            />
                        )}
                    </PopoverContent>
                </Popover>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={expenseSortOption} onValueChange={(value) => setExpenseSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Add New Expense</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <ExpenseForm />
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Expense History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                  <ScrollArea className="h-[250px] md:h-[350px] pr-2">
                    <TransactionList transactions={filteredExpensesForMonth} type="expense" sortOption={expenseSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'}/>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transfers">
            <div className="p-2 pt-0 md:p-4 md:pt-0 md:pb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Popover open={isCalendarOpen && currentTab === 'transfers'} onOpenChange={(isOpen) => currentTab === 'transfers' && setIsCalendarOpen(isOpen)}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-auto sm:min-w-[280px] justify-start text-left font-normal"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {isClient && selectedDate ? `History for ${format(selectedDate, "MMMM yyyy")}` : <span>Pick a month</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                       {isClient && (
                            <Calendar
                                key={selectedDate ? `transfer-calendar-${selectedDate.toISOString()}` : 'no-date-transfer-tab'}
                                mode="single"
                                selected={selectedDate ?? undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                                defaultMonth={selectedDate ?? undefined}
                                captionLayout="dropdown-buttons"
                                fromYear={calendarFromYear}
                                toYear={calendarToYear}
                            />
                       )}
                    </PopoverContent>
                </Popover>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Select value={transferSortOption} onValueChange={(value) => setTransferSortOption(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px]">
                        <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Record New Transfer</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 md:p-6 md:pt-2">
                  <TransferForm />
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline">Transfer History for {currentMonthYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
                   <ScrollArea className="h-[250px] md:h-[350px] pr-2">
                    <TransactionList transactions={filteredTransfersForMonth} type="transfer" sortOption={transferSortOption} onDateClick={handleTransactionDateNavigation} groupBy={'none'} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data">
            <Card className="shadow-lg">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="font-headline">Data Management</CardTitle>
                <CardDescription>Export your data for backup or import data from a previous backup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:space-y-6 md:p-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export / Backup Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download all your income, expense, and transfer entries as a JSON file. Keep this file in a safe place.
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Data
                  </Button>
                </div>
                <hr/>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Import data from a previously exported JSON file.
                  </p>
                  <div className="flex items-center p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/30 mb-3">
                     <AlertTriangle className="mr-3 h-6 w-6 flex-shrink-0" />
                     <div className="flex flex-col">
                       <h4 className="font-semibold">Important Warning</h4>
                       <p className="text-xs font-medium">
                         Importing will <strong className="font-bold">REPLACE ALL</strong> your current data. This action <strong className="font-bold">CANNOT BE UNDONE</strong>. Ensure you have a backup if needed.
                       </p>
                     </div>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import Data
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportData}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
      <footer className="py-6 md:py-8 text-center text-xs md:text-sm text-muted-foreground border-t mt-8 md:mt-12">
        © {new Date().getFullYear()} StaticsDiary. All rights reserved.
      </footer>
    </div>
  );
}
