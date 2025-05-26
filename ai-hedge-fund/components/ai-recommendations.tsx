import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

export function AIRecommendations() {
  const recommendations = [
    {
      id: 1,
      type: "BUY",
      symbol: "NVDA",
      confidence: 87,
      reason: "Strong momentum in AI sector, earnings beat expected",
      targetPrice: "$145.00",
      currentPrice: "$132.50",
      priority: "high",
    },
    {
      id: 2,
      type: "SELL",
      symbol: "META",
      confidence: 73,
      reason: "Overbought conditions, regulatory concerns",
      targetPrice: "$485.00",
      currentPrice: "$512.30",
      priority: "medium",
    },
    {
      id: 3,
      type: "HOLD",
      symbol: "AAPL",
      confidence: 65,
      reason: "Consolidation phase, await earnings catalyst",
      targetPrice: "$195.00",
      currentPrice: "$192.80",
      priority: "low",
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BUY":
        return "bg-green-100 text-green-800"
      case "SELL":
        return "bg-red-100 text-red-800"
      case "HOLD":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case "low":
        return <TrendingDown className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span>AI Trading Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
            role="article"
            aria-labelledby={`rec-${rec.id}-title`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge className={getTypeColor(rec.type)} role="status" aria-label={`Trade type: ${rec.type}`}>
                  {rec.type}
                </Badge>
                <span id={`rec-${rec.id}-title`} className="font-semibold text-lg">
                  {rec.symbol}
                </span>
                <span aria-label={`Priority: ${rec.priority}`}>{getPriorityIcon(rec.priority)}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="font-semibold" aria-label={`${rec.confidence} percent confidence`}>
                  {rec.confidence}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current: </span>
                <span className="font-medium">{rec.currentPrice}</span>
              </div>
              <div>
                <span className="text-gray-500">Target: </span>
                <span className="font-medium">{rec.targetPrice}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">{rec.reason}</p>

            <div className="flex space-x-2">
              <Button
                size="sm"
                className="flex-1"
                aria-label={`Execute ${rec.type} trade for ${rec.symbol} at ${rec.targetPrice}`}
              >
                Execute Trade
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label={`View detailed analysis for ${rec.symbol} recommendation`}
              >
                View Analysis
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
