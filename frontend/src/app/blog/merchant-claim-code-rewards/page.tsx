import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Merchant Claim Code Rewards | EPWX Task Hub",
  description:
    "How EPWX merchants issue fixed customer rewards with a reusable store QR, single-use purchase codes, wallet verification, and email updates.",
};

const flow = [
  {
    number: "01",
    title: "Customer completes a purchase",
    copy: "The merchant processes the sale normally. EPWX does not require the cashier to enter the purchase amount or customer information.",
    owner: "Store",
  },
  {
    number: "02",
    title: "Cashier generates one code",
    copy: "The cashier connects the authorized merchant wallet, selects Generate Claim Code, and signs the request. No blockchain transaction or gas payment is required.",
    owner: "Cashier",
  },
  {
    number: "03",
    title: "Customer scans the store QR",
    copy: "One permanent QR can serve every customer. It opens the merchant-specific EPWX code claim page; only the purchase code changes for each sale.",
    owner: "Customer",
  },
  {
    number: "04",
    title: "Customer enters code and email",
    copy: "The customer connects a wallet, enters the single-use purchase code and email address, and consents to claim status notifications.",
    owner: "Customer",
  },
  {
    number: "05",
    title: "EPWX validates the claim",
    copy: "EPWX checks the merchant, code status, 30-minute expiry, wallet, and reward configuration before creating a pending claim.",
    owner: "EPWX",
  },
  {
    number: "06",
    title: "Review, reward, and notify",
    copy: "Admin reviews the claim and distributes the fixed EPWX reward. The customer receives email updates when the claim is received, approved, rejected, or paid.",
    owner: "EPWX",
  },
];

export default function MerchantClaimCodeRewardsArticlePage() {
  return (
    <main className="bg-slate-950 px-4 py-10 text-slate-100">
      <article className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Merchant Rewards</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
            Fixed EPWX Rewards with One Store QR and Single-Use Purchase Codes
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            The new merchant flow removes receipt uploads from the primary customer journey and keeps cashier work to one action. Every eligible purchase can earn a fixed EPWX reward without recording the sale amount in EPWX.
          </p>
        </header>

        <section className="grid gap-7 border-b border-white/10 py-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-white">One QR for the store, one code for the purchase</h2>
            <p className="mt-3 leading-7 text-slate-300">
              The printed merchant QR is permanent and reusable. After each completed sale, the cashier generates a new eight-character code and shows it to that customer. Redeemed, expired, or cancelled codes never return to circulation.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="border-l-2 border-amber-300 pl-3 text-amber-100">100,000 EPWX fixed reward</span>
              <span className="border-l-2 border-cyan-300 pl-3 text-cyan-100">30-minute code lifetime</span>
              <span className="border-l-2 border-emerald-300 pl-3 text-emerald-100">Single use only</span>
            </div>
          </div>
          <figure className="overflow-hidden rounded-lg border border-white/15 bg-white p-3">
            <Image
              src="/blog/merchant-flow-01-qr-scan.png"
              alt="EPWX merchant QR displayed for customers"
              width={784}
              height={1168}
              className="h-auto w-full rounded-md"
            />
            <figcaption className="bg-white px-2 pb-1 pt-3 text-center text-xs font-semibold text-slate-700">
              Download the updated code-claim QR from the merchant admin page.
            </figcaption>
          </figure>
        </section>

        <section className="border-b border-white/10 py-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">End-to-end flow</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">From checkout to wallet reward</h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {flow.map((step) => (
              <div key={step.number} className="grid gap-3 py-5 sm:grid-cols-[56px_150px_minmax(0,1fr)] sm:items-start">
                <div className="text-2xl font-black text-amber-300">{step.number}</div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{step.owner}</span>
                  <h3 className="mt-1 font-extrabold text-white">{step.title}</h3>
                </div>
                <p className="leading-7 text-slate-300">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-white/10 py-9 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Less checkout work</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">What the cashier does</h2>
            <ol className="mt-4 space-y-3 text-slate-300">
              <li><strong className="text-white">1.</strong> Complete the normal sale.</li>
              <li><strong className="text-white">2.</strong> Select Generate Claim Code.</li>
              <li><strong className="text-white">3.</strong> Approve the wallet signature and show the code.</li>
            </ol>
            <p className="mt-5 border-l-2 border-emerald-300 pl-4 text-sm leading-6 text-emerald-100">
              No purchase amount, receipt, customer wallet, or email is entered by the cashier.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Clear communication</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">Customer email updates</h2>
            <p className="mt-4 leading-7 text-slate-300">
              The customer provides an email address and explicitly agrees to notifications while redeeming the code. EPWX then sends status updates for received, approved, rejected, and paid claims.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Email is kept private and is not returned by public merchant claim-list APIs. Delivery failure does not cancel a valid claim.
            </p>
          </div>
        </section>

        <section className="py-9">
          <h2 className="text-2xl font-extrabold text-white">Built-in safeguards</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-3 text-slate-300 md:grid-cols-2">
            <li className="border-l-2 border-amber-300 pl-3">Codes are random, hashed, merchant-bound, and single-use.</li>
            <li className="border-l-2 border-cyan-300 pl-3">Expired codes remain invalid and are never reassigned.</li>
            <li className="border-l-2 border-emerald-300 pl-3">Only an authorized merchant or admin wallet can generate codes.</li>
            <li className="border-l-2 border-rose-300 pl-3">Every generated code requires a fresh signed authorization.</li>
          </ul>
          <p className="mt-7 leading-7 text-slate-300">
            The original location and receipt upload process remains available as a fallback. Merchants adopting the faster code flow should download and print the updated QR, because previously printed QR images continue to open the receipt flow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/blog" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200">
              Explore EPWX Guides
            </Link>
            <Link href="/blog/merchant-customer-rewards" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
              Read Original Receipt Flow
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}