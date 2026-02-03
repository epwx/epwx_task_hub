import { EPWXStats } from "@/components/EPWXStats";

export default function PlatformStatsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">Platform Stats</h1>
      <EPWXStats />
    </div>
  );
}
