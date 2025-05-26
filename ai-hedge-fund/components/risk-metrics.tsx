import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertCircle, CheckCircle, XCircle } from "lucide-react"

export function RiskMetrics() {
  const riskMetrics = [
    {
      name: "Portfolio Beta",
      value: 1.23,
      target: 1.2,
      status: "warning",
      description: "Market sensitivity",
    },
    {
      name: "VaR (95%)",
      value: 2.1,
      target: 2.5,
      status: "good",
      description: "Daily value at risk (%)",
    },
    {
      name: "Correlation Risk",
      value: 0.67,
      target: 0.7,
      status: "good",
      description: "Asset correlation",
    },
    {
      name: "Leverage Ratio",
      value: 2.8,
      target: 3.0,
      status: "critical",
      description: "Current leverage",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span>Risk Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {riskMetrics.map((metric, index) => (
          <div key={index} className="space-y-2" role="group" aria-labelledby={`metric-${index}-name`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span aria-label={`Risk status: ${metric.status}`}>{getStatusIcon(metric.status)}</span>
                <span id={`metric-${index}-name`} className="font-medium">
                  {metric.name}
                </span>
              </div>
              <span
                className="text-sm font-semibold"
                aria-label={`Current value ${metric.value}, target ${metric.target}`}
              >
                {metric.value} / {metric.target}
              </span>
            </div>

            <Progress
              value={(metric.value / metric.target) * 100}
              className="h-2"
              aria-label={`${metric.name} progress: ${Math.round((metric.value / metric.target) * 100)}% of target`}
            />

            <p className="text-xs text-gray-500" id={`metric-${index}-desc`}>
              {metric.description}
            </p>
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Risk Assessment</span>
          </div>
          <p className="text-sm text-blue-800">
            Overall portfolio risk is within acceptable parameters. Monitor leverage ratio closely.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
