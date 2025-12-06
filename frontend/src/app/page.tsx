import Link from "next/link";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { EPWXStats } from "@/components/EPWXStats";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Earn EPWX Tokens
            <span className="block text-blue-600">Complete Social Tasks</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the EPWX ecosystem on Base network. Complete social media tasks and get rewarded with EPWX tokens instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/tasks"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Tasks
            </Link>
            <Link
              href="/advertise"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Create Campaign
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <EPWXStats />
        </section>

        {/* How It Works */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-gray-600">Connect your MetaMask wallet to the Base network</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Tasks</h3>
              <p className="text-gray-600">Follow, like, repost, or comment on social media</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn EPWX</h3>
              <p className="text-gray-600">Get rewarded instantly with EPWX tokens</p>
            </div>
          </div>
        </section>

        {/* Featured Tasks */}
        <section className="py-12">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Campaigns</h2>
          <TaskList />
          <div className="text-center mt-8">
            <Link
              href="/tasks"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View All Campaigns
            </Link>
          </div>
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
