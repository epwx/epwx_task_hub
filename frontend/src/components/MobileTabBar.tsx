"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TabIcon = "home" | "tasks" | "cashback" | "referrals" | "buy";

const TAB_ICON_PATHS: Record<TabIcon, string> = {
  home: "M3 11.2 12 4l9 7.2M5.5 9.8V19a1 1 0 0 0 1 1H9.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h3a1 1 0 0 0 1-1V9.8",
  tasks: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  cashback: "M12 3v18M17 7.5a3 3 0 0 0-3-2h-3a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5h-3a3 3 0 0 1-3-2",
  referrals: "M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19.5c.5-3 2.8-5 5.5-5s5 2 5.5 5M15 19.5c.35-2 1.7-3.5 3.6-3.9",
  buy: "M4 6h16l-1.5 9h-13L4 6Zm0 0-.7-2H2M9.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
};

const TAB_ITEMS: Array<{ href: string; label: string; icon: TabIcon }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/cashback", label: "Cashback", icon: "cashback" },
  { href: "/referrals", label: "Referrals", icon: "referrals" },
  { href: "/buy-epwx", label: "Buy", icon: "buy" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-between gap-1 border-t border-white/15 bg-slate-950/92 px-1.5 pt-2 shadow-[0_-8px_30px_rgba(2,6,23,0.45)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", backgroundColor: "rgba(2, 6, 23, 0.92)" }}
    >
      {TAB_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-center transition-colors ${isActive ? "bg-emerald-500/90 text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d={TAB_ICON_PATHS[item.icon]} />
            </svg>
            <span className={`text-[10px] font-black uppercase tracking-[0.08em] ${isActive ? "text-slate-950" : "text-white/70"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
