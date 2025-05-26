import { TradingDashboard } from "@/components/trading-dashboard"
import { Suspense } from "react"

function TradingContent() {
  return <TradingDashboard />
}

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Trading</h1>
          <p className="text-gray-600">
            Execute trades with Alpaca API integration. Currently using paper trading for safety.
          </p>
        </div>

        <Suspense fallback={<div>Loading trading dashboard...</div>}>
          <TradingContent />
        </Suspense>
      </div>
    </div>
  )
}
