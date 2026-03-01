import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Pool Party | Server Rewards",
  description: "The cleanest way for restaurant teams to track sales and pool tips.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased min-h-screen bg-[var(--background)] flex justify-center">
        <main className="w-full max-w-md min-h-screen bg-[var(--background)] flex flex-col relative shadow-xl overflow-x-hidden">
          {children}
          <Toaster position="top-center" />
        </main>
      </body>
    </html>
  );
}
