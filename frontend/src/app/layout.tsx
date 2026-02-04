import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EPWX Tasks - Earn EPWX by Completing Campaigns",
  description: "Complete campaigns and earn EPWX tokens",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <body className={inter.className}>
        <Providers>
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
