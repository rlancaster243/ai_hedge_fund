import { PortfolioOverview } from "@/components/portfolio-overview"
import { AIRecommendations } from "@/components/ai-recommendations"
import { MarketAnalysis } from "@/components/market-analysis"
import { RiskMetrics } from "@/components/risk-metrics"
import { RecentTrades } from "@/components/recent-trades"
import Link from "next/link"
import { Brain } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <PortfolioOverview />
        <div className="mb-8">
          <Link href="/trading-advisor">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white cursor-pointer hover:from-purple-600 hover:to-blue-700 transition-all">
              <div className="flex items-center space-x-3">
                <Brain className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-bold">AI Trading Advisor</h2>
                  <p className="text-purple-100">Get intelligent trading recommendations with Groq AI</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AIRecommendations />
          <RiskMetrics />
        </div>
        <MarketAnalysis />
        <RecentTrades />
      </div>
    </div>
  )
}
