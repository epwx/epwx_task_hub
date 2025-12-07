import Link from "next/link";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { EPWXStats } from "@/components/EPWXStats";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              🚀 Powered by Base Network
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Earn EPWX Tokens
              <span className="block mt-2">Complete Social Tasks</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join the EPWX ecosystem on Base network. Complete social media tasks and get rewarded with EPWX tokens instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/tasks"
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10">Browse Tasks</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/advertise"
                className="bg-white text-blue-600 px-10 py-4 rounded-xl text-lg font-bold border-2 border-blue-600 hover:bg-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Create Campaign
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <EPWXStats />
        </section>

        {/* How It Works */}
        <section className="py-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">How It Works</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Get started in three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Connect Wallet</h3>
              <p className="text-gray-600 leading-relaxed">Connect your MetaMask wallet to the Base network and start earning</p>
            </div>
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Complete Tasks</h3>
              <p className="text-gray-600 leading-relaxed">Follow, like, repost, or comment on social media platforms</p>
            </div>
            <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Earn EPWX</h3>
              <p className="text-gray-600 leading-relaxed">Get rewarded instantly with EPWX tokens to your wallet</p>
            </div>
          </div>
        </section>

        {/* Featured Tasks */}
        <section className="py-16">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Featured Campaigns</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Start earning EPWX tokens today</p>
          <TaskList />
          <div className="text-center mt-12">
            <Link
              href="/tasks"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              View All Campaigns →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">EPWX Task Platform</h3>
            <p className="text-gray-400">Earn tokens by completing social tasks on Base Network</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6">
            <a href="https://epowex.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Main Site</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span className="hidden md:block text-gray-600">•</span>
            <a href="https://twitter.com/epowex" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2025 EPWX Task Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
