import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  try {
    // Check if user already exists in the database
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) return loggedInUser;

    // Create a new user if not found
    const name = `${user.firstName} ${user.lastName}`.trim();

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
      },
    });

    return newUser;
  } catch (error: any) {
    console.error("Error in checkUser:", error.message);
    return null;
  }
};
