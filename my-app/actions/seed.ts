"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

const ACCOUNT_ID = "df08a591-4b49-4a4b-850d-7d3a20ee04ca";
const USER_ID = "195663f7-50bb-487e-837d-183f4eb69ffa";

type CategoryType = "INCOME" | "EXPENSE";

interface CategoryRange {
  name: string;
  range: [number, number];
}

const CATEGORIES: Record<CategoryType, CategoryRange[]> = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Generate random amount within a range
function getRandomAmount(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Get random category and amount
function getRandomCategory(type: CategoryType): { category: string; amount: number } {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const transactions: {
      id: string;
      type: CategoryType;
      amount: number;
      description: string;
      date: Date;
      category: string;
      status: string;
      userId: string;
      accountId: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const type: CategoryType = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        transactions.push({
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        });

        totalBalance += type === "INCOME" ? amount : -amount;
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } });
      await tx.transaction.createMany({ data: transactions });
      await tx.account.update({ where: { id: ACCOUNT_ID }, data: { balance: totalBalance } });
    });

    return { success: true, message: `Created ${transactions.length} transactions` };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
