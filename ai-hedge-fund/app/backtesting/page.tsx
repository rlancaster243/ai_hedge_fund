import { BacktestingDashboard } from "@/components/backtesting-dashboard"

export default function BacktestingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Backtesting</h1>
          <p className="text-gray-600">
            Test your trading strategies with historical data using Blueshift integration.
          </p>
        </div>

        <BacktestingDashboard />
      </div>
    </div>
  )
}
