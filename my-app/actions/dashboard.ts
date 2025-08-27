"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Account, User } from "@prisma/client";

type CreateAccountInput = {
  name: string;
  balance: number | string;
  isDefault?: boolean;
  type?: string;
};

type SerializedAccount = Omit<Account, "balance"> & {
  balance: number;
};

const serializeTransaction = (obj: Account): SerializedAccount => ({
  ...obj,
  balance: obj.balance instanceof Object && "toNumber" in obj.balance ? obj.balance.toNumber() : (obj.balance as number),
});

export async function createAccount(
  data: CreateAccountInput
): Promise<{ success: boolean; data?: SerializedAccount; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user: User | null = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Convert the balance into float
    const balanceFloat = typeof data.balance === "string" ? parseFloat(data.balance) : data.balance;
    if (isNaN(balanceFloat)) throw new Error("Invalid balance amount");

    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If this is the first account, make it default
    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault ?? false;

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserAccounts(): Promise<SerializedAccount[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user: User | null = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return accounts.map(serializeTransaction);
}
