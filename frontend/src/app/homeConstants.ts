export const themedSectionClass = "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_24px_65px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-8";
export const themedInnerClass = "relative z-10";
export const glassPanelClass = "rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-lg";
export const EPWX_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) || "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";
export const DEFAULT_DAILY_REWARD = 100_000;
export const MID_TIER_DAILY_REWARD = 2_000_000;
export const BONUS_DAILY_REWARD = 5_000_000;
export const MEGA_DAILY_REWARD = 10_000_000;
export const MID_TIER_DAILY_REWARD_THRESHOLD = 10_000_000_000;
export const BONUS_DAILY_REWARD_THRESHOLD = 100_000_000_000;
export const MEGA_DAILY_REWARD_THRESHOLD = 1_000_000_000_000;
export const TELEGRAM_VERIFICATION_RECHECK_INTERVAL_MS = 60_000;
export const LATEST_WINNERS_REFRESH_INTERVAL_MS = 60_000;
export const NEXT_DRAW_COUNTDOWN_REFRESH_INTERVAL_MS = 1_000;
export const DEFAULT_AUTO_DAILY_DRAW_TIME_UTC = "00:05";
export const NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC = String(process.env.NEXT_PUBLIC_AUTO_DAILY_DRAW_TIME_UTC || DEFAULT_AUTO_DAILY_DRAW_TIME_UTC).trim();
export const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "epwx_bot";
export const PENDING_REFERRAL_STORAGE_KEY = "epwx-pending-referrer";
export const PENDING_PARTNER_REFERRAL_CODE_STORAGE_KEY = "epwx-pending-partner-referral-code";
export const HOME_SHORTCUT_SECTIONS = ['buy-epwx', 'burnt-supply', 'latest-winners', 'daily-claim'] as const;
export const DAILY_REWARD_TIERS = [
  {
    walletBalanceLabel: `At least ${MEGA_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${MEGA_DAILY_REWARD.toLocaleString()} EPWX`,
  },
  {
    walletBalanceLabel: `At least ${BONUS_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${BONUS_DAILY_REWARD.toLocaleString()} EPWX`,
  },
  {
    walletBalanceLabel: `At least ${MID_TIER_DAILY_REWARD_THRESHOLD.toLocaleString()} EPWX`,
    rewardLabel: `${MID_TIER_DAILY_REWARD.toLocaleString()} EPWX`,
  },
  {
    walletBalanceLabel: "Below 10,000,000,000 EPWX",
    rewardLabel: `${DEFAULT_DAILY_REWARD.toLocaleString()} EPWX`,
  },
];

export type HomeShortcutSection = typeof HOME_SHORTCUT_SECTIONS[number];
