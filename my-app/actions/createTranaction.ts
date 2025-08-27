"use server";

import { request } from "@arcjet/next";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import aj from "@/lib/arcjet";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Account, Transaction, User } from "@prisma/client";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

type TransactionInput = {
  accountId: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  isRecurring?: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  merchantName?: string;
};

type SerializedTransaction = Omit<Transaction, "amount"> & {
  amount: number;
};

const serializeAmount = (obj: Transaction): SerializedTransaction => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

function calculateNextRecurringDate(
  startDate: Date | string,
  interval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
): Date {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

export async function createTransaction(
  data: TransactionInput
): Promise<{ success: boolean; data?: SerializedTransaction; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: { remaining, resetInSeconds: reset },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    const user: User | null = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const account: Account | null = await db.account.findUnique({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function scanReceipt(
  file: File
): Promise<{
  amount?: number;
  date?: Date;
  description?: string;
  category?: string;
  merchantName?: string;
}> {
  try {
    const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If it's not a receipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error: any) {
    console.error("Error scanning receipt", error.message);
    throw new Error("Failed to scan receipt");
  }
}

export async function getTransaction(
  id: string
): Promise<SerializedTransaction> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user: User | null = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(
  id: string,
  data: TransactionInput
): Promise<{ success: boolean; data?: SerializedTransaction; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user: User | null = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const originalTransaction = await db.transaction.findUnique({
      where: { id, userId: user.id },
      include: { account: true },
    });
    if (!originalTransaction) throw new Error("Transaction not found");

    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const netBalanceChange = newBalanceChange - oldBalanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: netBalanceChange } },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
