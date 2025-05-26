import { TestTradingDashboard } from "@/components/test-trading-dashboard"

export default function TestTradingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Trading Integration</h1>
          <p className="text-gray-600">
            Execute test trades to verify Alpaca paper trading integration is working correctly.
          </p>
        </div>

        <TestTradingDashboard />
      </div>
    </div>
  )
}
