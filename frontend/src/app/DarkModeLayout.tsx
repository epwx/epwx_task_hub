"use client";
import { useState, useEffect } from "react";
import Header from "@/components/Header";

export default function DarkModeLayout({ children }: { children: React.ReactNode }) {
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
      {children}
    </>
  );
}
