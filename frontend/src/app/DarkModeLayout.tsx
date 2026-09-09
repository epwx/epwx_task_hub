"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";

export default function DarkModeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Home renders its own contextual mobile action bar; the embedded Telegram mini app
  // has its own navigation, so skip the global tab bar there.
  const excludedTabBarPrefixes = ["/telegram-miniapp"];
  const showMobileTabBar = pathname !== "/" && !excludedTabBarPrefixes.some((prefix) => pathname.startsWith(prefix));

  // On mount, read theme from localStorage or system, default to dark
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme');
      if (theme === 'light') return false;
      // Default to dark mode if not set
      return true;
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className={`pt-[72px] sm:pt-[76px] ${showMobileTabBar ? 'pb-4 lg:pb-0' : ''}`}>
        {children}
      </div>
      {showMobileTabBar ? <MobileTabBar /> : null}
    </>
  );
}
