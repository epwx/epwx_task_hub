import Link from "next/link";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { EPWXStats } from "@/components/EPWXStats";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Earn EPWX Tokens
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete simple social media tasks and get rewarded instantly
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/tasks"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Browse Tasks
            </Link>
            <Link
              href="/advertise"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Create Campaign
            </Link>
          </div>
        </section>

        {/* EPWX Stats */}
        <section className="mb-12">
          <EPWXStats />
        </section>

        {/* How It Works */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-gray-600">
                Connect your wallet and link your Twitter account
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Tasks</h3>
              <p className="text-gray-600">
                Like, repost, comment on posts to earn EPWX
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Rewarded</h3>
              <p className="text-gray-600">
                Receive EPWX tokens instantly after verification
              </p>
            </div>
          </div>
        </section>

        {/* Featured Tasks */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Tasks</h2>
          <TaskList limit={6} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="https://epowex.com" className="hover:text-blue-400">Main Site</a>
            <a href="/terms" className="hover:text-blue-400">Terms</a>
            <a href="/privacy" className="hover:text-blue-400">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
