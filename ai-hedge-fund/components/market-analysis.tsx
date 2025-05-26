"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp } from "lucide-react"

export function MarketAnalysis() {
  const performanceData = [
    { month: "Jan", portfolio: 8.2, benchmark: 5.1, alpha: 3.1 },
    { month: "Feb", portfolio: 12.5, benchmark: 7.8, alpha: 4.7 },
    { month: "Mar", portfolio: -2.1, benchmark: -4.2, alpha: 2.1 },
    { month: "Apr", portfolio: 15.3, benchmark: 9.6, alpha: 5.7 },
    { month: "May", portfolio: 18.7, benchmark: 12.4, alpha: 6.3 },
    { month: "Jun", portfolio: 22.1, benchmark: 15.8, alpha: 6.3 },
  ]

  const sectorAllocation = [
    { sector: "Technology", allocation: 35, performance: 18.5 },
    { sector: "Healthcare", allocation: 20, performance: 12.3 },
    { sector: "Finance", allocation: 15, performance: 8.7 },
    { sector: "Energy", allocation: 12, performance: 22.1 },
    { sector: "Consumer", allocation: 10, performance: 6.4 },
    { sector: "Other", allocation: 8, performance: 9.8 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <span>Performance vs Benchmark</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label="Line chart showing portfolio performance compared to S&P 500 benchmark over 6 months"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `${value}%`,
                    name === "portfolio" ? "Portfolio" : name === "benchmark" ? "S&P 500" : "Alpha",
                  ]}
                />
                <Line type="monotone" dataKey="portfolio" stroke="#2563eb" strokeWidth={2} name="portfolio" />
                <Line type="monotone" dataKey="benchmark" stroke="#64748b" strokeWidth={2} name="benchmark" />
                <Line type="monotone" dataKey="alpha" stroke="#16a34a" strokeWidth={2} name="alpha" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Sector Allocation & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label="Bar chart showing sector allocation percentages and performance across different market sectors"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorAllocation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "allocation" ? `${value}%` : `${value}%`,
                    name === "allocation" ? "Allocation" : "Performance",
                  ]}
                />
                <Bar dataKey="allocation" fill="#3b82f6" name="allocation" />
                <Bar dataKey="performance" fill="#10b981" name="performance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
