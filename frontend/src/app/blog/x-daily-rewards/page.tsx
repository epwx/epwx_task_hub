import CopyArticleButton from "@/components/CopyArticleButton";

const article = `Claim EPWX Daily, Build Long-Term Rewards

What if one simple daily habit could create long-term on-chain value?

At EPWX, our goal is to reward consistent community participation through daily claims.

This is not a one-time campaign mindset.
This is a long-term participation model for active community members.

Why We Built This

Many reward programs are short-term and disappear quickly.

EPWX is designed to support ongoing daily participation with clear eligibility rules and verification, so real members can keep engaging over time.

How Daily Claim Works

1. Connect your wallet
2. Join the EPWX Telegram group
3. Verify via Telegram
4. Complete eligibility checks
5. Claim your daily EPWX reward

Built for Real Members

To reduce abuse and keep distribution fair, EPWX uses:
- Wallet-based identity
- Telegram group verification
- Backend eligibility and anti-abuse checks

Daily Consistency Over Hype

"Claim daily rewards for lifetime" reflects our long-term vision of consistent rewards for active users, subject to platform rules, token availability, and program terms.

It is about steady participation, not guaranteed income.

Who This Is For

- Community members who show up consistently
- Long-term Web3 participants
- Users who prefer transparent, repeatable reward flows

Final Note

If you are part of the EPWX community, make daily claiming part of your routine:

Connect.
Verify.
Claim.
Repeat.

#EPWX #Base #Web3 #Crypto #DailyRewards #Onchain`;

export default function XDailyRewardsArticlePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/45 via-slate-900 to-blue-950 p-6 shadow-2xl md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">EPWX X Article</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">Claim EPWX Daily, Build Long-Term Rewards</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          Ready-to-post version for X with wallet + Telegram verification flow and compliance-safe wording.
        </p>

        <div className="mt-6">
          <CopyArticleButton article={article} />
        </div>

        <article className="mt-8 whitespace-pre-line rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-200 md:text-base">
          {article}
        </article>
      </section>
    </main>
  );
}
