import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, DollarSign, TrendingUp, PieChart, Target } from "lucide-react"

export function PortfolioOverview() {
  const metrics = [
    {
      title: "Total Portfolio Value",
      value: "$127,450,000",
      change: "+2.4%",
      changeType: "positive",
      icon: DollarSign,
    },
    {
      title: "Daily P&L",
      value: "+$2,890,000",
      change: "+2.3%",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      title: "Sharpe Ratio",
      value: "1.87",
      change: "+0.12",
      changeType: "positive",
      icon: Target,
    },
    {
      title: "Max Drawdown",
      value: "-3.2%",
      change: "-0.5%",
      changeType: "negative",
      icon: PieChart,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white" role="article" aria-labelledby={`metric-${index}-title`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id={`metric-${index}-title`} className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900" aria-label={`${metric.title}: ${metric.value}`}>
              {metric.value}
            </div>
            <div className="flex items-center text-xs">
              {metric.changeType === "positive" ? (
                <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
              )}
              <span
                className={metric.changeType === "positive" ? "text-green-600" : "text-red-600"}
                aria-label={`Change: ${metric.change} ${metric.changeType === "positive" ? "increase" : "decrease"}`}
              >
                {metric.change}
              </span>
              <span className="text-gray-500 ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
