import { Suspense } from "react";
import { getAccountWithTransactions } from "../../../../actions/accounts";
import { BarLoader } from "react-spinners";
import TransactionTable from "../_components/transaction-table";
import { AccountChart } from "../_components/account-charts";
import { notFound } from "next/navigation";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number | string;
  _count: {
    transactions: number;
  };
  // other fields as needed
}

interface Transaction {
  id: string;
  description: string;
  date: string | Date;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  isRecurring?: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  nextRecurringDate?: string | Date;
}

interface AccountData extends Account {
  transactions: Transaction[];
}

interface AccountPageProps {
  params: {
    id: string;
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const accountData: AccountData | null = await getAccountWithTransactions(params.id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5 py-25">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(account.balance.toString()).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <Suspense
        fallback={<BarLoader className="mt-4" width="100%" color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width="100%" color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
