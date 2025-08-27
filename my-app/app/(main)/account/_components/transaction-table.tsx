"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableFooter,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { categoryColors } from "../../../../data/categories";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Clock, RefreshCcw, Search, Trash, X, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { bulkDeleteTransactions } from "../../../../actions/accounts";
import { BarLoader } from "react-spinners";

export interface Transaction {
  id: string;
  description: string;
  date: string | Date;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  isReccuring?: boolean;
  reccuringInterval?: keyof typeof RECURRING_INTERVALS;
  nextRecurringDate?: string | Date;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
} as const;

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: "asc" | "desc" }>({
    field: "date",
    direction: "desc",
  });
  const [deleted, setDeleted] = useState<any>(null);
  const [deleteloading, setDeleteLoading] = useState(false);

  const deleteFn = async (ids: string[]) => {
    setDeleteLoading(true);
    try {
      const response = await bulkDeleteTransactions(ids);
      setDeleted(response);
    } catch (error) {
      console.error("Error deleting transactions:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAndSortedTransaction = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((t) => t.description?.toLowerCase().includes(searchLower));
    }

    if (recurringFilter) {
      result = result.filter((t) =>
        recurringFilter === "recurring" ? t.isReccuring : !t.isReccuring
      );
    }

    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === filteredAndSortedTransaction.length
        ? []
        : filteredAndSortedTransaction.map((t) => t.id)
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) {
      return;
    }
    deleteFn(selectedIds);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRecurringFilter("");
    setTypeFilter("");
    setSelectedIds([]);
  };

  useEffect(() => {
    if (deleted && !deleteloading) {
      // Replace with toast/notification logic
      console.log("Transaction deleted successfully");
    }
  }, [deleted, deleteloading]);

  return (
    <div className="space-y-4">
      {deleteloading && <BarLoader className="mt-4" width="100%" color="#9333ea" />}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recurringFilter} onValueChange={setRecurringFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}

          {(searchTerm || typeFilter || recurringFilter) && (
            <Button variant="outline" size="icon" onClick={handleClearFilters} title="Clear Filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length === filteredAndSortedTransaction.length &&
                    filteredAndSortedTransaction.length > 0
                  }
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date{" "}
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                <div className="flex items-center">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                <div className="flex items-center">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransaction.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No Transactions Found!
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransaction.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{ background: categoryColors[transaction.category] }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{ color: transaction.type === "EXPENSE" ? "red" : "green" }}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isReccuring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="gap-1 text-purple-700 hover:bg-purple-200">
                              <RefreshCcw className="h-3 w-3" />
                              {RECURRING_INTERVALS[transaction.reccuringInterval!]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>{format(new Date(transaction.nextRecurringDate!), "PP")}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => router.push(`/transaction/create?edit=${transaction.id}`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteFn([transaction.id])}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default TransactionTable;
