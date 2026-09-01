import Image from "next/image";

export default function MerchantCustomerRewardsArticlePage() {
  const customerFlow = [
    {
      title: "1. Scan the in-store QR code",
      copy: "Customer scans the merchant QR code and lands on the EPWX claim page with merchant details prefilled.",
      screenshotTag: "FLOW_01_QR_SCAN",
      screenshotSrc: "/blog/merchant-flow-01-qr-scan.png",
      screenshotAlt: "Merchant QR code card used by customers to start EPWX reward claim",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "2. Allow location access",
      copy: "Customer allows location permission so EPWX can verify they are physically at the store.",
      screenshotTag: "FLOW_02_LOCATION_PERMISSION",
      screenshotSrc: "/blog/merchant-flow-02-location-permission.png",
      screenshotAlt: "Merchant claim screen asking user to enable GPS or location services",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "3. Pass geofence verification",
      copy: "The system checks if the customer is within 50 meters of the merchant location before enabling claim actions.",
      screenshotTag: "FLOW_03_GEOFENCE_CHECK",
      screenshotSrc: "/blog/merchant-flow-03-geofence-check.jpg",
      screenshotAlt: "Claim page message indicating user is not at merchant location even with location enabled",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "4. Connect wallet",
      copy: "Customer connects wallet to establish wallet-based identity for a secure and auditable reward flow.",
      screenshotTag: "FLOW_04_WALLET_CONNECT",
      screenshotSrc: "/blog/merchant-flow-04-wallet-connect.jpg",
      screenshotAlt: "Merchant claim screen prompting customer to connect wallet",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
      secondaryScreenshotSrc: "/blog/merchant-flow-04-wallet-chooser.jpg",
      secondaryScreenshotAlt: "Wallet chooser modal with available wallet options for connecting to EPWX",
      secondaryScreenshotWidth: 784,
      secondaryScreenshotHeight: 1168,
      secondaryScreenshotClassName: "mx-auto mt-3 h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "5. Submit claim",
      copy: "Customer submits claim details after purchase. The request is recorded for backend validation.",
      screenshotTag: "FLOW_05_CLAIM_SUBMIT",
      screenshotSrc: "/blog/merchant-flow-05-claim-submit.jpg",
      screenshotAlt: "Merchant claim screen for uploading receipt and submitting claim",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "6. Admin reviews and approves",
      copy: "Admin reviews pending claims and approves valid requests using the admin panel workflow.",
      screenshotTag: "FLOW_06_ADMIN_APPROVAL",
      screenshotSrc: "/blog/merchant-flow-06-admin-approval.jpg",
      screenshotAlt: "Admin panel showing pending merchant claims with distribute and reject actions",
      screenshotWidth: 784,
      screenshotHeight: 1168,
      screenshotClassName: "mx-auto h-auto w-full max-w-2xl rounded-lg",
    },
    {
      title: "7. Reward sent to customer wallet",
      copy: "Approved claims are paid from admin wallet directly to customer wallet, with status and tx tracking.",
      screenshotTag: "FLOW_07_REWARD_SENT",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-5xl rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-cyan-950 p-6 shadow-2xl md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">EPWX Merchant Campaign</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Merchant Customer Rewards: Turn Every Store Visit into an On-Chain Loyalty Moment</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
          EPWX helps merchants reward real in-store customers with transparent, wallet-based incentives. No merchant token distribution complexity, no payout burden, and a verifiable customer reward history.
        </p>

        <div className="mt-5 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <p className="font-bold">Campaign promise</p>
          <p className="mt-1">
            Customers buy from merchants as normal. EPWX rewards are distributed separately by admin after claim approval, directly to customer wallets.
          </p>
        </div>

        <article className="mt-8 space-y-7 text-sm leading-7 text-slate-200 md:text-base">
          <section>
            <h2 className="text-2xl font-extrabold text-white">Why merchants join this program</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
              <li>Attract repeat foot traffic with a clear customer reward story.</li>
              <li>Strengthen loyalty without adding discount pressure to merchant margins.</li>
              <li>Get visibility into customer reward activity through merchant dashboard status tracking.</li>
              <li>Build trust through geofencing, wallet identity, and admin-reviewed distribution.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">Customer reward flow (with screenshot slots)</h2>
            <p className="mt-2 text-slate-300">
              Each flow block below includes a screenshot placeholder. Once you share screenshots, replace each placeholder with the matching image.
            </p>

            <div className="mt-4 space-y-5">
              {customerFlow.map((flow) => (
                <div key={flow.screenshotTag} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-bold text-white">{flow.title}</h3>
                  <p className="mt-2 text-slate-300">{flow.copy}</p>
                  {flow.screenshotSrc ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-cyan-300/35 bg-cyan-300/5 p-2">
                      <Image
                        src={flow.screenshotSrc}
                        alt={flow.screenshotAlt || flow.screenshotTag}
                        width={flow.screenshotWidth || 768}
                        height={flow.screenshotHeight || 1365}
                        className={flow.screenshotClassName || "mx-auto h-auto w-full max-w-md rounded-lg"}
                      />
                      {flow.secondaryScreenshotSrc ? (
                        <Image
                          src={flow.secondaryScreenshotSrc}
                          alt={flow.secondaryScreenshotAlt || flow.screenshotTag}
                          width={flow.secondaryScreenshotWidth || 768}
                          height={flow.secondaryScreenshotHeight || 1365}
                          className={flow.secondaryScreenshotClassName || "mx-auto mt-3 h-auto w-full max-w-md rounded-lg"}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-cyan-300/50 bg-cyan-300/10 p-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                      Screenshot placeholder: {flow.screenshotTag}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">Reward controls and fairness</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="font-bold text-amber-200">24-hour claim control</p>
                <p className="mt-1 text-sm text-amber-100/90">Claims are limited per customer identity window to help prevent abuse.</p>
              </div>
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4">
                <p className="font-bold text-cyan-200">Location validation</p>
                <p className="mt-1 text-sm text-cyan-100/90">Rewards are only available when the customer is physically near the merchant location.</p>
              </div>
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                <p className="font-bold text-emerald-200">Admin-reviewed payouts</p>
                <p className="mt-1 text-sm text-emerald-100/90">Only approved claims are rewarded from admin wallet to customer wallet.</p>
              </div>
              <div className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-4">
                <p className="font-bold text-rose-200">Merchant-safe model</p>
                <p className="mt-1 text-sm text-rose-100/90">Merchants do not distribute tokens and are not charged reward program fees.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-white">CTA for merchants</h2>
            <p className="mt-2 text-slate-300">
              If you run a physical store and want to increase customer return visits with Web3-native loyalty mechanics, EPWX Merchant Customer Rewards is built for you.
            </p>
            <p className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 font-semibold text-emerald-100">
              Ready to activate your merchant location? Contact EPWX admin to onboard your store and generate your in-store claim QR.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
