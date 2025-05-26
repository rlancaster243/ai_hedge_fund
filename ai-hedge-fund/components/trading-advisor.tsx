"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, AlertTriangle, Target, Shield, TrendingUp, Building } from "lucide-react"
import { getTradingAdvice } from "@/app/actions/trading-advice"
import { saveAIRecommendation } from "@/app/actions/trading"

interface MarketData {
  symbol: string
  currentPrice: number
  dayChangePercent: number
  weekChangePercent: number
  monthChangePercent: number
  volume: number
  marketCap: number
  peRatio: number
  beta: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  companyName: string
  sector: string
  industry: string
  dataSource: string
  technicalIndicators: {
    rsi: number
    macd: number
    sma20: number
    sma50: number
    bollinger: {
      upper: number
      middle: number
      lower: number
    }
  }
  newsSentiment: {
    score: number
    label: string
    articles: any[]
  }
}

interface TradingAdvice {
  recommendation: string
  confidence: number
  targetPrice: number
  stopLoss: number
  timeHorizon: string
  riskFactors: string[]
  analysis: string
}

export function TradingAdvisor() {
  const [symbol, setSymbol] = useState("")
  const [loading, setLoading] = useState(false)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [advice, setAdvice] = useState<TradingAdvice | null>(null)
  const [error, setError] = useState("")

  const router = useRouter()

  const analyzeStock = async () => {
    if (!symbol.trim()) {
      setError("Please enter a stock symbol")
      return
    }

    setLoading(true)
    setError("")
    setMarketData(null)
    setAdvice(null)

    try {
      // Fetch market data from Alpha Vantage
      const response = await fetch(`/api/market-data?symbol=${symbol.toUpperCase()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch market data")
      }

      const data = await response.json()
      setMarketData(data)

      // Get AI trading advice
      const tradingAdvice = await getTradingAdvice(symbol.toUpperCase(), data)
      setAdvice(tradingAdvice)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return "text-green-600"
    if (score < -0.1) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Trading Advisor</span>
            <Badge
              variant="outline"
              className={`ml-auto ${marketData?.dataSource?.includes("Alpha Vantage") ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}
            >
              {marketData?.dataSource || "Alpha Vantage Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && analyzeStock()}
              className="flex-1"
              aria-label="Stock symbol input"
            />
            <Button onClick={analyzeStock} disabled={loading} aria-label={`Analyze ${symbol || "stock"}`}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setLoading(true)
                try {
                  const testResponse = await fetch("/api/market-data?symbol=AAPL")
                  const testData = await testResponse.json()
                  console.log("Alpha Vantage Test Result:", testData)
                  alert(
                    `✅ Alpha Vantage Test Successful!\n\nAAPL Price: $${testData.currentPrice}\nData Source: ${testData.dataSource}\nRSI: ${testData.technicalIndicators?.rsi?.toFixed(1)}`,
                  )
                } catch (error) {
                  console.error("Test failed:", error)
                  alert(`❌ Test Failed: ${error instanceof Error ? error.message : "Unknown error"}`)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              🧪 Test Alpha Vantage
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {marketData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Overview */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>
                    {marketData.symbol} - {marketData.companyName}
                  </span>
                </div>
                <Badge variant="outline" className="text-sm">
                  ${marketData.currentPrice?.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Sector</p>
                  <p className="font-semibold">{marketData.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-semibold">{marketData.industry}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-semibold">${(marketData.marketCap / 1000000000).toFixed(2)}B</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data Source</p>
                  <p className="font-semibold text-green-600">{marketData.dataSource}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price & Performance */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Price & Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Day Change</p>
                  <p
                    className={`font-semibold ${marketData.dayChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {marketData.dayChangePercent >= 0 ? "+" : ""}
                    {marketData.dayChangePercent?.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Week Change</p>
                  <p
                    className={`font-semibold ${marketData.weekChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {marketData.weekChangePercent >= 0 ? "+" : ""}
                    {marketData.weekChangePercent?.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Volume</p>
                  <p className="font-semibold">{marketData.volume?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">P/E Ratio</p>
                  <p className="font-semibold">{marketData.peRatio?.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {marketData && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Technical Analysis & Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">RSI (14)</p>
                <p
                  className={`font-semibold ${marketData.technicalIndicators?.rsi > 70 ? "text-red-600" : marketData.technicalIndicators?.rsi < 30 ? "text-green-600" : "text-gray-600"}`}
                >
                  {marketData.technicalIndicators?.rsi?.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">MACD</p>
                <p className="font-semibold">{marketData.technicalIndicators?.macd?.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">20-day SMA</p>
                <p className="font-semibold">${marketData.technicalIndicators?.sma20?.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">News Sentiment</p>
                <p className={`font-semibold ${getSentimentColor(marketData.newsSentiment?.score)}`}>
                  {marketData.newsSentiment?.label} ({marketData.newsSentiment?.score?.toFixed(2)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {advice && marketData && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Trading Recommendation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge
                  className={getRecommendationColor(advice.recommendation)}
                  aria-label={`Recommendation: ${advice.recommendation}`}
                >
                  {advice.recommendation}
                </Badge>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <span className={`font-semibold ${getConfidenceColor(advice.confidence)}`}>{advice.confidence}%</span>
                </div>
              </div>
              <Badge variant="outline">{advice.timeHorizon}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Price Targets</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-semibold text-green-600">${advice.targetPrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stop Loss:</span>
                    <span className="font-semibold text-red-600">${advice.stopLoss?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Risk Factors</span>
                </div>
                <ul className="space-y-1 pl-6">
                  {advice.riskFactors?.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Detailed Analysis</span>
              </div>
              <p className="text-gray-700 leading-relaxed pl-6">{advice.analysis}</p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                className="flex-1"
                onClick={async () => {
                  // Save the recommendation first
                  await saveAIRecommendation(advice, marketData)

                  // Navigate to trading page with pre-filled data
                  const tradeParams = new URLSearchParams({
                    symbol: marketData.symbol,
                    side: advice.recommendation.toLowerCase(),
                    quantity: "100",
                    orderType: "market",
                    source: "ai-recommendation",
                    confidence: advice.confidence.toString(),
                    targetPrice: advice.targetPrice.toString(),
                    stopLoss: advice.stopLoss.toString(),
                  })

                  router.push(`/trading?${tradeParams.toString()}`)
                }}
                aria-label={`Execute ${advice.recommendation} order for ${marketData?.symbol}`}
              >
                Execute Trade (100 shares)
              </Button>
              <Button variant="outline" aria-label="Save recommendation to watchlist">
                Save to Watchlist
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
