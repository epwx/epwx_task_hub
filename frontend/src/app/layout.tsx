import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";
import DarkModeLayout from "./DarkModeLayout";

// Inline script to set dark mode class on html before hydration
function setInitialDarkModeScript() {
  return `
    (function() {
      try {
        var dark = localStorage.getItem('theme') === 'dark';
        if (
          dark ||
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;
}

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
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialDarkModeScript() }} />
      </head>
      <body className={inter.className}>
        <Providers>
          <DarkModeLayout>
            {children}
            <Toaster position="top-right" />
          </DarkModeLayout>
        </Providers>
      </body>
    </html>
  );
}
