
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Landmark, Trash2, Wallet, Utensils, Car, Home, Film, Activity, ShoppingBag, Package, Pencil, ArrowRightLeft, Repeat } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import type { IncomeEntry, ExpenseEntry, TransferEntry, TransactionType, TransactionCardProps as OriginalTransactionCardProps, TransactionSource } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "./income-form";
import { TransferForm } from "./transfer-form";
import { cn } from "@/lib/utils";


interface TransactionCardProps extends OriginalTransactionCardProps {
  onDateClick?: (date: string, type: TransactionType) => void;
}


const categoryIcons: { [key: string]: React.ElementType } = {
  food: Utensils,
  transport: Car,
  utilities: Home,
  entertainment: Film,
  healthcare: Activity,
  shopping: ShoppingBag,
  default: Package,
};

const CategoryIcon = ({ category }: { category: string }) => {
  const normalizedCategory = category.toLowerCase();
  const IconComponent = categoryIcons[normalizedCategory] || categoryIcons.default;
  return <IconComponent className="mr-2 h-4 w-4 text-primary" />;
};

const SourceIcon = ({ source }: { source: TransactionSource }) => {
    return source === 'wallet' ? <Wallet className="mr-2 h-5 w-5 text-green-500" /> : <Landmark className="mr-2 h-5 w-5 text-blue-500" />;
}

export function TransactionCard({ transaction, type, onDateClick }: TransactionCardProps) {
  const { deleteIncome, deleteExpense, deleteTransfer } = useAppContext();
  const [isExpenseEditDialogOpen, setIsExpenseEditDialogOpen] = useState(false);
  const [isIncomeEditDialogOpen, setIsIncomeEditDialogOpen] = useState(false);
  const [isTransferEditDialogOpen, setIsTransferEditDialogOpen] = useState(false);


  const handleDelete = () => {
    if (type === 'income') {
      deleteIncome(transaction.id);
    } else if (type === 'expense') {
      deleteExpense(transaction.id);
    } else if (type === 'transfer') {
      deleteTransfer(transaction.id);
    }
  };

  const handleDateClick = () => {
    if (onDateClick) {
      onDateClick(transaction.date, type);
    }
  };

  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  const isTransfer = type === 'transfer';

  const incomeData = transaction as IncomeEntry;
  const expenseData = transaction as ExpenseEntry;
  const transferData = transaction as TransferEntry;

  let DialogComponent;
  let EditFormComponent;
  let dialogOpenState;
  let setDialogOpenState;
  let dialogTitle = "";

  if (isIncome) {
    DialogComponent = IncomeForm;
    dialogOpenState = isIncomeEditDialogOpen;
    setDialogOpenState = setIsIncomeEditDialogOpen;
    dialogTitle = "Edit Income";
    EditFormComponent = <IncomeForm isEditMode initialData={incomeData} onSubmitSuccess={() => setIsIncomeEditDialogOpen(false)} />;
  } else if (isExpense) {
    DialogComponent = ExpenseForm;
    dialogOpenState = isExpenseEditDialogOpen;
    setDialogOpenState = setIsExpenseEditDialogOpen;
    dialogTitle = "Edit Expense";
    EditFormComponent = <ExpenseForm isEditMode initialData={expenseData} onSubmitSuccess={() => setIsExpenseEditDialogOpen(false)} />;
  } else if (isTransfer) {
    DialogComponent = TransferForm;
    dialogOpenState = isTransferEditDialogOpen;
    setDialogOpenState = setIsTransferEditDialogOpen;
    dialogTitle = "Edit Transfer";
    EditFormComponent = <TransferForm isEditMode initialData={transferData} onSubmitSuccess={() => setIsTransferEditDialogOpen(false)} />;
  }


  return (
    <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="p-3 pb-2 md:p-4 md:pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base md:text-lg font-headline">
              {isIncome && (
                <span className="flex items-center">
                  <SourceIcon source={incomeData.source} />
                  {incomeData.source.charAt(0).toUpperCase() + incomeData.source.slice(1)} Income
                </span>
              )}
              {isExpense && (
                <span className="flex items-center">
                  <CategoryIcon category={expenseData.category} />
                  {expenseData.category}
                  {expenseData.subcategory && <span className="text-sm text-muted-foreground ml-1">/ {expenseData.subcategory}</span>}
                   <span className="text-xs text-muted-foreground ml-1">({expenseData.source})</span>
                </span>
              )}
              {isTransfer && (
                <span className="flex items-center">
                  <Repeat className="mr-2 h-5 w-5 text-purple-500" />
                  Transfer: {transferData.fromSource.charAt(0).toUpperCase() + transferData.fromSource.slice(1)}
                  <ArrowRightLeft className="mx-1 h-3 w-3 text-muted-foreground" />
                  {transferData.toSource.charAt(0).toUpperCase() + transferData.toSource.slice(1)}
                </span>
              )}
            </CardTitle>
            {onDateClick ? (
                <button
                    onClick={handleDateClick}
                    className={cn(
                        "text-xs text-left p-0 h-auto",
                        "text-muted-foreground hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
                    )}
                    aria-label={`View transactions for ${formatDate(transaction.date)}`}
                >
                    {formatDate(transaction.date)}
                </button>
            ) : (
                <CardDescription className="text-xs">
                    {formatDate(transaction.date)}
                </CardDescription>
            )}
          </div>
          {DialogComponent && EditFormComponent && setDialogOpenState && (
            <div className="flex items-center space-x-1">
                <Dialog open={dialogOpenState} onOpenChange={setDialogOpenState}>
                    <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 h-7 w-7 md:h-8 md:w-8">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    {EditFormComponent}
                    </DialogContent>
                </Dialog>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7 md:h-8 md:w-8">
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this transaction.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
        <p className={`text-lg md:text-xl font-semibold ${isIncome ? 'text-green-600' : isExpense ? 'text-red-600' : 'text-purple-600'}`}>
          {formatCurrency(transaction.amount)}
        </p>
        {transaction.description && (
          <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
