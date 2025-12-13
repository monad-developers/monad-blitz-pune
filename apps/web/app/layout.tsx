import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/orpc.server"; // for pre-rendering
import "./globals.css";
import AppLayout from "@/components/layout";
import MonadWalletProvider from "@/components/monad/WalletProvider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monad Arcade",
  description:
    "A platform for playing and creating games on the Monad blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <MonadWalletProvider>
            <AppLayout>{children}</AppLayout>
          </MonadWalletProvider>
        </Providers>
        <Toaster closeButton />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
