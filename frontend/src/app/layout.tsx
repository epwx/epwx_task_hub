import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { isMaintenanceModeEnabled } from "@/utils/maintenanceMode";
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

function MaintenanceScreen() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <div className="mb-6 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">
          Maintenance Mode
        </div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          EPWX Task Hub is temporarily unavailable.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          We are deploying an update right now. Please check back in a few minutes.
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Your wallet, reward, and campaign data are not affected.
        </p>
      </div>
    </main>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();

  if (isMaintenanceModeEnabled()) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <MaintenanceScreen />
        </body>
      </html>
    );
  }

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
