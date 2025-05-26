import { TradingAdvisor } from "@/components/trading-advisor"

export default function TradingAdvisorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Trading Advisor</h1>
          <p className="text-gray-600">
            Get intelligent trading recommendations powered by Groq AI and real market data analysis.
          </p>
        </div>

        <TradingAdvisor />
      </div>
    </div>
  )
}
