"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { executeTradeAction, getAccountInfo, getMarketQuote } from "@/app/actions/trading"
import { validateAlpacaPrice } from "@/lib/alpaca"
import { Loader2, CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  details?: any
}

export function TestTradingDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState("")
  const [progress, setProgress] = useState(0)
  const [accountInfo, setAccountInfo] = useState<any>(null)

  const testCases = [
    {
      name: "Account Connection Test",
      description: "Verify connection to Alpaca paper trading account",
      test: async () => {
        const result = await getAccountInfo()
        if (!result.success) {
          throw new Error(result.error)
        }
        setAccountInfo(result)
        return {
          portfolio_value: result.account.portfolio_value,
          buying_power: result.account.buying_power,
          status: result.account.status,
        }
      },
    },
    {
      name: "Market Data Test",
      description: "Test real-time market data retrieval",
      test: async () => {
        const result = await getMarketQuote("AAPL")
        if (!result.success) {
          throw new Error(result.error)
        }
        return {
          symbol: "AAPL",
          current_price: result.currentPrice,
          bid: result.quote.bid,
          ask: result.quote.ask,
          spread: result.spread,
        }
      },
    },
    {
      name: "Price Validation Test",
      description: "Test price rounding and validation for Alpaca",
      test: async () => {
        const testPrices = [
          { original: 427.87999999999994, symbol: "AAPL" },
          { original: 150.123456789, symbol: "MSFT" },
          { original: 99.999, symbol: "GOOGL" },
          { original: 0.005, symbol: "PENNY" },
        ]

        const validatedPrices = testPrices.map((test) => ({
          original: test.original,
          validated: validateAlpacaPrice(test.original, test.symbol),
          symbol: test.symbol,
        }))

        return {
          test_cases: validatedPrices,
          all_valid: validatedPrices.every((p) => p.validated >= 0.01 && p.validated <= 100000),
        }
      },
    },
    {
      name: "Single Buy Order Test",
      description: "Execute one buy order to avoid wash trade detection",
      test: async () => {
        const result = await executeTradeAction({
          symbol: "SPY", // Use ETF to reduce wash trade risk
          side: "buy",
          quantity: 1,
          orderType: "market",
        })
        if (!result.success) {
          throw new Error(result.error)
        }
        return {
          order_id: result.alpacaOrder.id,
          status: result.alpacaOrder.status,
          symbol: result.alpacaOrder.symbol,
          quantity: result.alpacaOrder.qty,
          validated_prices: result.validatedPrices,
        }
      },
    },
    {
      name: "Limit Order Test",
      description: "Execute a limit order with validated pricing (no immediate execution)",
      test: async () => {
        // Get current market price first
        const quote = await getMarketQuote("QQQ") // Use different ETF
        if (!quote.success) {
          throw new Error("Failed to get market quote")
        }

        // Set limit price well below market to avoid execution (and wash trades)
        const rawLimitPrice = quote.currentPrice * 0.85 // 15% below market
        const validatedLimitPrice = validateAlpacaPrice(rawLimitPrice, "QQQ")

        const result = await executeTradeAction({
          symbol: "QQQ",
          side: "buy",
          quantity: 1,
          orderType: "limit",
          limitPrice: validatedLimitPrice,
        })
        if (!result.success) {
          throw new Error(result.error)
        }
        return {
          order_id: result.alpacaOrder.id,
          status: result.alpacaOrder.status,
          symbol: result.alpacaOrder.symbol,
          limit_price: result.alpacaOrder.limit_price,
          market_price: quote.currentPrice,
          limit_discount: (((quote.currentPrice - validatedLimitPrice) / quote.currentPrice) * 100).toFixed(1) + "%",
          price_validation: result.validatedPrices,
        }
      },
    },
    {
      name: "Different Symbol Test",
      description: "Test with a different symbol to avoid wash trades",
      test: async () => {
        const result = await executeTradeAction({
          symbol: "IWM", // Small cap ETF - different from previous tests
          side: "buy",
          quantity: 1,
          orderType: "market",
        })
        if (!result.success) {
          throw new Error(result.error)
        }
        return {
          symbol: "IWM",
          order_id: result.alpacaOrder.id,
          status: result.alpacaOrder.status,
          validated_prices: result.validatedPrices,
        }
      },
    },
    {
      name: "Order Status Check",
      description: "Verify we can check order status without creating new orders",
      test: async () => {
        const result = await getAccountInfo()
        if (!result.success) {
          throw new Error(result.error)
        }

        const recentOrders = result.orders.slice(0, 3)
        return {
          total_orders: result.orders.length,
          recent_orders: recentOrders.map((order) => ({
            id: order.id,
            symbol: order.symbol,
            side: order.side,
            status: order.status,
            created_at: order.created_at,
          })),
          account_status: result.account.status,
        }
      },
    },
  ]

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setProgress(0)

    const results: TestResult[] = []

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      setCurrentTest(testCase.name)
      setProgress(((i + 1) / testCases.length) * 100)

      try {
        const details = await testCase.test()
        results.push({
          name: testCase.name,
          status: "success",
          message: "Test passed successfully",
          details,
        })
      } catch (error) {
        results.push({
          name: testCase.name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }

      setTestResults([...results])

      // Add a small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsRunning(false)
    setCurrentTest("")
  }

  const runSingleTest = async (index: number) => {
    const testCase = testCases[index]
    setCurrentTest(testCase.name)

    const newResults = [...testResults]
    newResults[index] = {
      name: testCase.name,
      status: "pending",
      message: "Running test...",
    }
    setTestResults(newResults)

    try {
      const details = await testCase.test()
      newResults[index] = {
        name: testCase.name,
        status: "success",
        message: "Test passed successfully",
        details,
      }
    } catch (error) {
      newResults[index] = {
        name: testCase.name,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }

    setTestResults(newResults)
    setCurrentTest("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "pending":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  useEffect(() => {
    // Initialize test results
    setTestResults(
      testCases.map((test) => ({
        name: test.name,
        status: "pending" as const,
        message: "Ready to run",
      })),
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Account Status */}
      {accountInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Portfolio Value</p>
                <p className="text-lg font-semibold">
                  ${Number.parseFloat(accountInfo.account.portfolio_value).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buying Power</p>
                <p className="text-lg font-semibold">
                  ${Number.parseFloat(accountInfo.account.buying_power).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <Badge variant="outline">{accountInfo.account.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Price Validation Fix:</strong> All prices are now properly rounded to avoid sub-penny errors. The
              system validates and adjusts prices to meet Alpaca's requirements.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button onClick={runAllTests} disabled={isRunning} className="flex-1">
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTestResults(
                  testCases.map((test) => ({
                    name: test.name,
                    status: "pending" as const,
                    message: "Ready to run",
                  })),
                )
              }}
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Test: {currentTest}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {testCases.map((testCase, index) => {
          const result = testResults[index]
          return (
            <Card key={index} className={result ? getStatusColor(result.status) : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result && getStatusIcon(result.status)}
                    <div>
                      <CardTitle className="text-lg">{testCase.name}</CardTitle>
                      <p className="text-sm text-gray-600">{testCase.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => runSingleTest(index)} disabled={isRunning}>
                    Run Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {result && (
                  <div className="space-y-3">
                    <Alert className={getStatusColor(result.status)}>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>

                    {result.details && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Test Details:</p>
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {testResults.filter((r) => r.status === "success").length}
                </p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {testResults.filter((r) => r.status === "error").length}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {testResults.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
