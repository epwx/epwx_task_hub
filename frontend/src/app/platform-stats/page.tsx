import { Header } from "@/components/Header";
import { EPWXStats } from "@/components/EPWXStats";

export default function PlatformStatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">Platform Stats</h1>
        <EPWXStats />
      </main>
    </div>
  );
}
