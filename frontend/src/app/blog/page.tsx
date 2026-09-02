import Link from "next/link";

const posts = [
  {
    href: "/blog/telegram-group-owner-rewards",
    tag: "Guide",
    tagClassName: "text-cyan-200",
    title: "Telegram Group Owner Rewards: End-to-End Step-by-Step Flow",
    description:
      "How Telegram Group Owner Rewards work in EPWX Task Hub, from group registration to admin payout and ledger tracking.",
    borderClassName: "border-cyan-300/20 hover:border-cyan-300/50",
  },
  {
    href: "/blog/merchant-customer-rewards",
    tag: "Marketing",
    tagClassName: "text-emerald-200",
    title: "Merchant Customer Rewards: Turn Every Store Visit into an On-Chain Loyalty Moment",
    description: "Merchant Customer Reward Program article with screenshot placeholders.",
    borderClassName: "border-emerald-300/20 hover:border-emerald-300/50",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">EPWX Blog</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">Latest Posts</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
          Guides and updates about EPWX Task Hub rewards, Telegram flows, and merchant programs.
        </p>

        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className={`block rounded-2xl border bg-slate-900/60 p-5 shadow-xl transition-colors ${post.borderClassName}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.15em] ${post.tagClassName}`}>{post.tag}</p>
              <h2 className="mt-2 text-xl font-extrabold text-white">{post.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{post.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

