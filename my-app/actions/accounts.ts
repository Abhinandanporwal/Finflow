"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Account, Transaction, User } from "@prisma/client";

type SerializedTransaction<T> = Omit<T, "balance" | "amount"> & {
  balance?: number;
  amount?: number;
};

const serializeTransaction = <T extends { balance?: any; amount?: any }>(
  obj: T
): SerializedTransaction<T> => {
  const serialized: any = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber
      ? obj.balance.toNumber()
      : obj.balance;
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber
      ? obj.amount.toNumber()
      : obj.amount;
  }
  return serialized;
};

export async function updateDefaultAccount(
  accountId: string
): Promise<{ success: boolean; data?: SerializedTransaction<Account>; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user: User | null = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) throw new Error("User not found");

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(
  accountId: string
): Promise<{ success: boolean; error?: string } | (SerializedTransaction<Account> & { transactions: SerializedTransaction<Transaction>[] }) | null> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user: User | null = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: { orderBy: { date: "desc" } },
        _count: { select: { transactions: true } },
      },
    });

    if (!account) return null;

    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteTransactions(
  transactionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user: User | null = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const transactions: Transaction[] = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId: user.id },
    });

    const accountBalanceChanges: Record<string, number> = transactions.reduce(
      (acc, transaction) => {
        const change =
          transaction.type === "EXPENSE"
            ? transaction.amount
            : -transaction.amount;
        acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
        return acc;
      },
      {} as Record<string, number>
    );

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds }, userId: user.id },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
