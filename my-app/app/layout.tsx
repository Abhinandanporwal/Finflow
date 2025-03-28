import type { Metadata } from "next";
import { Inter} from "next/font/google";
import "./globals.css";
import Header from "@/components/header"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Toaster } from "sonner";
const inter= Inter({subsets :['latin']});

export const metadata: Metadata = {
  title: "FinFlow",
  description: "Next Gen Budget Management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={'${inter.className}'}>
          {/*header */}
        <Header></Header>
        <main className="min-h-screen">{children}</main>
        <Toaster richColors/>
        {/* footer */}
        <footer className="bg-blue-50 py-12"> 
          <div className="container mx-auto px-4 text-center text-gray-700 " >
            <p>
              Made with🫶 by Abhinandan
            </p>
            </div>
          </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
