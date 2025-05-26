import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, ExternalLink } from "lucide-react"

export function RecentTrades() {
  const trades = [
    {
      id: "T001",
      symbol: "TSLA",
      type: "BUY",
      quantity: 500,
      price: 248.5,
      timestamp: "2024-01-15 14:32:15",
      status: "Executed",
      pnl: "+$2,450",
      strategy: "Momentum AI",
    },
    {
      id: "T002",
      symbol: "GOOGL",
      type: "SELL",
      quantity: 200,
      price: 142.8,
      timestamp: "2024-01-15 13:45:22",
      status: "Executed",
      pnl: "+$1,890",
      strategy: "Mean Reversion",
    },
    {
      id: "T003",
      symbol: "AMZN",
      type: "BUY",
      quantity: 300,
      price: 155.2,
      timestamp: "2024-01-15 12:18:45",
      status: "Pending",
      pnl: "-",
      strategy: "Arbitrage AI",
    },
    {
      id: "T004",
      symbol: "MSFT",
      type: "SELL",
      quantity: 150,
      price: 378.9,
      timestamp: "2024-01-15 11:22:10",
      status: "Executed",
      pnl: "+$3,200",
      strategy: "Sentiment Analysis",
    },
  ]

  const getTypeColor = (type: string) => {
    return type === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Executed":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <span>Recent Trades</span>
          </CardTitle>
          <Button variant="outline" size="sm" aria-label="View all trades in detailed view">
            View All Trades
            <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" role="region" aria-label="Recent trades table">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Trade ID
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Symbol
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Type
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Quantity
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Price
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  P&L
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600" scope="col">
                  Strategy
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-mono text-sm">{trade.id}</td>
                  <td className="py-3 px-2 font-semibold">{trade.symbol}</td>
                  <td className="py-3 px-2">
                    <Badge className={getTypeColor(trade.type)} aria-label={`Trade type: ${trade.type}`}>
                      {trade.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-2" aria-label={`${trade.quantity.toLocaleString()} shares`}>
                    {trade.quantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-2" aria-label={`Price: ${trade.price} dollars`}>
                    ${trade.price}
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={getStatusColor(trade.status)} aria-label={`Status: ${trade.status}`}>
                      {trade.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 font-semibold text-green-600" aria-label={`Profit and loss: ${trade.pnl}`}>
                    {trade.pnl}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">{trade.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
