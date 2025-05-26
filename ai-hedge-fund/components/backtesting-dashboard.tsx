"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { createBacktestAction, getBacktestHistory, getBacktestDetails, deleteBacktest } from "@/app/actions/backtesting"
import { backtestTemplates } from "@/lib/backtrader-templates"
import { Loader2, BarChart3, TrendingUp, Target, AlertTriangle, Code, Trash2, Copy } from "lucide-react"

export function BacktestingDashboard() {
  const [backtests, setBacktests] = useState<any[]>([])
  const [selectedBacktest, setSelectedBacktest] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [backtestForm, setBacktestForm] = useState({
    name: "",
    strategyCode: backtestTemplates.smaStrategy.code,
    startDate: new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    initialCapital: "100000",
    symbols: "AAPL,MSFT,GOOGL",
  })

  // Helper function to safely format numbers
  const formatNumber = (value: any, decimals = 2): string => {
    if (value === null || value === undefined || value === "") {
      return "N/A"
    }
    const num = Number(value)
    if (isNaN(num)) {
      return "N/A"
    }
    return num.toFixed(decimals)
  }

  // Helper function to safely format percentages
  const formatPercentage = (value: any, decimals = 2): string => {
    if (value === null || value === undefined || value === "") {
      return "N/A"
    }
    const num = Number(value)
    if (isNaN(num)) {
      return "N/A"
    }
    return (num * 100).toFixed(decimals) + "%"
  }

  const testUrlDetection = async () => {
    setLoading(true)
    try {
      console.log("Testing automatic URL detection...")

      const testBacktest = {
        name: "URL Detection Test - SMA Strategy",
        strategyCode: backtestTemplates.smaStrategy.code,
        startDate: "2023-06-01",
        endDate: "2023-12-31",
        initialCapital: 50000,
        symbols: ["AAPL"],
      }

      const result = await createBacktestAction(testBacktest)

      if (result.success) {
        console.log("✅ URL detection test successful!", result)
        alert("✅ URL Detection Test Passed!\n\nBacktest created successfully. Check the console for details.")
        loadBacktestHistory()
      } else {
        console.error("❌ URL detection test failed:", result.error)
        alert(`❌ URL Detection Test Failed:\n\n${result.error}`)
      }
    } catch (error) {
      console.error("❌ Test error:", error)
      alert(`❌ Test Error:\n\n${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBacktestHistory()
  }, [])

  const loadBacktestHistory = async () => {
    const result = await getBacktestHistory()
    if (result.success) {
      setBacktests(result.backtests)
    }
  }

  const handleCreateBacktest = async () => {
    if (!backtestForm.name || !backtestForm.strategyCode) return

    setLoading(true)
    try {
      const result = await createBacktestAction({
        name: backtestForm.name,
        strategyCode: backtestForm.strategyCode,
        startDate: backtestForm.startDate,
        endDate: backtestForm.endDate,
        initialCapital: Number.parseFloat(backtestForm.initialCapital),
        symbols: backtestForm.symbols.split(",").map((s) => s.trim()),
      })

      if (result.success) {
        setBacktestForm({
          name: "",
          strategyCode: backtestTemplates.smaStrategy.code,
          startDate: new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          initialCapital: "100000",
          symbols: "AAPL,MSFT,GOOGL",
        })
        loadBacktestHistory()
      }
    } catch (error) {
      console.error("Backtest error:", error)
    } finally {
      setLoading(false)
    }
  }

  const viewBacktestDetails = async (backtestId: number) => {
    const result = await getBacktestDetails(backtestId)
    if (result.success) {
      setSelectedBacktest(result.backtest)
    }
  }

  const handleDeleteBacktest = async (backtestId: number) => {
    if (confirm("Are you sure you want to delete this backtest?")) {
      const result = await deleteBacktest(backtestId)
      if (result.success) {
        loadBacktestHistory()
        if (selectedBacktest?.id === backtestId) {
          setSelectedBacktest(null)
        }
      }
    }
  }

  const loadTemplate = (templateKey: string) => {
    const template = backtestTemplates[templateKey as keyof typeof backtestTemplates]
    if (template) {
      setBacktestForm({
        ...backtestForm,
        name: template.name,
        strategyCode: template.code,
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Backtest</TabsTrigger>
          <TabsTrigger value="templates">Strategy Templates</TabsTrigger>
          <TabsTrigger value="history">Backtest History</TabsTrigger>
          {selectedBacktest && <TabsTrigger value="details">Results</TabsTrigger>}
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Create Backtrader Backtest</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Backtest Name</label>
                  <Input
                    placeholder="My Backtrader Strategy"
                    value={backtestForm.name}
                    onChange={(e) => setBacktestForm({ ...backtestForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Capital ($)</label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={backtestForm.initialCapital}
                    onChange={(e) => setBacktestForm({ ...backtestForm, initialCapital: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={backtestForm.startDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={backtestForm.endDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Symbols (comma-separated)</label>
                  <Input
                    placeholder="AAPL,MSFT,GOOGL"
                    value={backtestForm.symbols}
                    onChange={(e) => setBacktestForm({ ...backtestForm, symbols: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Backtrader Strategy Code (Python)</label>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(backtestForm.strategyCode)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <Textarea
                  placeholder="Enter your Backtrader strategy code..."
                  value={backtestForm.strategyCode}
                  onChange={(e) => setBacktestForm({ ...backtestForm, strategyCode: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={testUrlDetection} disabled={loading} variant="outline" className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing URL Detection...
                    </>
                  ) : (
                    "🧪 Test URL Detection"
                  )}
                </Button>

                <Button onClick={handleCreateBacktest} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running Backtrader Backtest...
                    </>
                  ) : (
                    "Run Backtest"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(backtestTemplates).map(([key, template]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button onClick={() => loadTemplate(key)} className="flex-1">
                      Use Template
                    </Button>
                    <Button variant="outline" onClick={() => copyToClipboard(template.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backtest History</CardTitle>
            </CardHeader>
            <CardContent>
              {backtests.length > 0 ? (
                <div className="space-y-4">
                  {backtests.map((backtest: any) => (
                    <div key={backtest.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{backtest.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(backtest.start_date).toLocaleDateString()} to{" "}
                          {new Date(backtest.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Initial: ${Number.parseFloat(backtest.initial_capital || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant="outline">{backtest.status}</Badge>
                        {backtest.total_return && (
                          <p
                            className={`text-sm font-semibold ${Number(backtest.total_return) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatPercentage(backtest.total_return)} return
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => viewBacktestDetails(backtest.id)}>
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBacktest(backtest.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No backtests yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedBacktest && (
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${Number(selectedBacktest.total_return || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatPercentage(selectedBacktest.total_return)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(selectedBacktest.sharpe_ratio)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    -{formatPercentage(selectedBacktest.max_drawdown)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(selectedBacktest.win_rate, 1)}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Value Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBacktest.results && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={JSON.parse(selectedBacktest.results).daily_returns || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${Number.parseFloat(value).toLocaleString()}`, "Portfolio Value"]}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {selectedBacktest.results && (
              <Card>
                <CardHeader>
                  <CardTitle>Trade Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Trades: </span>
                        <span className="font-medium">{selectedBacktest.total_trades || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Winning Trades: </span>
                        <span className="font-medium text-green-600">
                          {Math.round(((selectedBacktest.win_rate || 0) / 100) * (selectedBacktest.total_trades || 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Losing Trades: </span>
                        <span className="font-medium text-red-600">
                          {(selectedBacktest.total_trades || 0) -
                            Math.round(((selectedBacktest.win_rate || 0) / 100) * (selectedBacktest.total_trades || 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Final Value: </span>
                        <span className="font-medium">
                          ${Number(selectedBacktest.final_value || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
