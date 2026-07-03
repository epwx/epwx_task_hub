export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/45 via-slate-900 to-blue-950 p-6 shadow-2xl md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">EPWX Blog</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
          Telegram Group Owner Rewards: End-to-End Step-by-Step Flow
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          This guide explains exactly how Telegram Group Owner Rewards work in EPWX Task Hub, from group registration to
          admin payout and ledger tracking.
        </p>
        <p className="mt-3 rounded-xl border border-emerald-300/35 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
          Reward rule: 10,000 EPWX is distributed to the Telegram group owner for each eligible group-attributed member daily claim.
        </p>

        <article className="mt-8 space-y-7 text-sm leading-7 text-slate-200 md:text-base">
          <section>
            <h2 className="text-xl font-extrabold text-white">1. Telegram Bot Commands</h2>
            <p className="mt-3 text-slate-300">Use these commands in the EPWX Telegram bot to run the owner-reward and claim flows:</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-100">
                  <tr>
                    <th className="px-3 py-2 font-bold">Command</th>
                    <th className="px-3 py-2 font-bold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono">/miniapp</td>
                    <td className="px-3 py-2">Open EPWX Daily Claim Mini App.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono">/verify</td>
                    <td className="px-3 py-2">Legacy Telegram verification flow (not required for Mini App claim path).</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono">/registergroup</td>
                    <td className="px-3 py-2">Group owner only: register current Telegram group for owner rewards.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono">/postdailyclaimbutton</td>
                    <td className="px-3 py-2">Group owner only: post the Daily Claim button in the group.</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-3 py-2 font-mono">/start</td>
                    <td className="px-3 py-2">Open base bot flow. Also supports deep-link params used by group registration and group claim campaigns.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">2. Group owner registers a group</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Group owner runs the registration command in Telegram.</li>
              <li>Telegram bot opens the Mini App with group registration context.</li>
              <li>Owner connects wallet and links it to Telegram account.</li>
              <li>Backend verifies owner role in the Telegram group before activation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">3. Members claim from group context</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Member opens Mini App from the group claim link.</li>
              <li>Member links wallet and submits daily claim signature.</li>
              <li>Backend validates membership and official Telegram requirements.</li>
              <li>If eligible, a Telegram Group Owner Reward is recorded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">4. Reward status lifecycle</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3">
                <p className="font-bold text-amber-200">Pending</p>
                <p className="mt-1 text-xs text-amber-100/90">Created after a valid member claim with group context.</p>
              </div>
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3">
                <p className="font-bold text-emerald-200">Paid</p>
                <p className="mt-1 text-xs text-emerald-100/90">Marked paid by admin after successful on-chain transfer.</p>
              </div>
              <div className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3">
                <p className="font-bold text-rose-200">Blocked</p>
                <p className="mt-1 text-xs text-rose-100/90">Rejected by eligibility rules such as self-attribution checks.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">5. Admin payout flow</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Admin opens Telegram Group Rewards page and filters pending rewards.</li>
              <li>Admin distributes 10,000 EPWX to owner wallet from connected admin wallet for each pending reward row.</li>
              <li>Backend marks reward as paid with tx hash.</li>
              <li>Reward ledger entry is written for audit trail.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">6. Wallet compatibility notes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Telegram in-app browser can block some wallet flows.</li>
              <li>Use external browser, Coinbase Wallet browser, or MetaMask browser when prompted.</li>
              <li>Backend supports both normal signatures and smart-wallet signatures for wallet linking and daily claims.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-white">7. Quick troubleshooting</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>If group title is missing in admin table, refresh after backend title backfill runs.</li>
              <li>If signature fails, confirm connected wallet and linked wallet are the same.</li>
              <li>If rewards do not appear, verify member claimed from group link and membership checks passed.</li>
            </ul>
          </section>
        </article>
      </section>
    </main>
  );
}
