"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  executeTradeAction,
  getAccountInfo,
  getTradeHistory,
  cancelOrderAction,
  getMarketQuote,
} from "@/app/actions/trading"
import { Loader2, DollarSign, TrendingUp, Activity, AlertCircle, CheckCircle, X } from "lucide-react"

export function TradingDashboard() {
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [alpacaOrders, setAlpacaOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tradeResult, setTradeResult] = useState<any>(null)
  const [currentQuote, setCurrentQuote] = useState<any>(null)
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    side: "buy" as "buy" | "sell",
    quantity: "",
    orderType: "market" as "market" | "limit" | "stop",
    limitPrice: "",
    stopPrice: "",
  })

  const searchParams = useSearchParams()

  useEffect(() => {
    loadAccountInfo()
    loadTradeHistory()
  }, [])

  // Handle pre-filled trade data from AI recommendations
  useEffect(() => {
    const symbol = searchParams.get("symbol")
    const side = searchParams.get("side")
    const quantity = searchParams.get("quantity")
    const orderType = searchParams.get("orderType")
    const source = searchParams.get("source")

    if (symbol && side && source === "ai-recommendation") {
      setTradeForm({
        symbol: symbol.toUpperCase(),
        side: side as "buy" | "sell",
        quantity: quantity || "100",
        orderType: (orderType as "market" | "limit" | "stop") || "market",
        limitPrice: "",
        stopPrice: "",
      })

      // Get current quote for the symbol
      getQuote(symbol)

      // Show a notification that the form was pre-filled
      setTradeResult({
        success: true,
        message: `Trade form pre-filled from AI recommendation for ${symbol.toUpperCase()}`,
      })
    }
  }, [searchParams])

  const loadAccountInfo = async () => {
    const result = await getAccountInfo()
    if (result.success) {
      setAccountInfo(result)
    } else {
      console.error("Failed to load account info:", result.error)
    }
  }

  const loadTradeHistory = async () => {
    const result = await getTradeHistory()
    if (result.success) {
      setTrades(result.trades)
      setAlpacaOrders(result.alpacaOrders || [])
    }
  }

  const getQuote = async (symbol: string) => {
    if (!symbol) return
    const result = await getMarketQuote(symbol)
    if (result.success) {
      setCurrentQuote(result)
    }
  }

  const handleTrade = async () => {
    if (!tradeForm.symbol || !tradeForm.quantity) {
      setTradeResult({ success: false, error: "Please fill in all required fields" })
      return
    }

    setLoading(true)
    setTradeResult(null)

    try {
      const result = await executeTradeAction({
        symbol: tradeForm.symbol.toUpperCase(),
        side: tradeForm.side,
        quantity: Number.parseInt(tradeForm.quantity),
        orderType: tradeForm.orderType,
        limitPrice: tradeForm.limitPrice ? Number.parseFloat(tradeForm.limitPrice) : undefined,
        stopPrice: tradeForm.stopPrice ? Number.parseFloat(tradeForm.stopPrice) : undefined,
      })

      setTradeResult(result)

      if (result.success) {
        setTradeForm({
          symbol: "",
          side: "buy",
          quantity: "",
          orderType: "market",
          limitPrice: "",
          stopPrice: "",
        })
        setCurrentQuote(null)
        loadTradeHistory()
        loadAccountInfo()
      }
    } catch (error) {
      console.error("Trade error:", error)
      setTradeResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const result = await cancelOrderAction(orderId)
    if (result.success) {
      loadTradeHistory()
      loadAccountInfo()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "filled":
        return "bg-green-100 text-green-800"
      case "pending_new":
      case "new":
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
      case "canceled":
        return "bg-gray-100 text-gray-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {accountInfo?.account?.portfolio_value
                ? Number.parseFloat(accountInfo.account.portfolio_value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Paper trading account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buying Power</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {accountInfo?.account?.buying_power
                ? Number.parseFloat(accountInfo.account.buying_power).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountInfo?.positions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active holdings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountInfo?.account?.status || "Unknown"}</div>
            <p className="text-xs text-muted-foreground">Paper trading active</p>
          </CardContent>
        </Card>
      </div>

      {/* Trade Result Alert */}
      {tradeResult && (
        <Alert className={tradeResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={tradeResult.success ? "text-green-800" : "text-red-800"}>
            {tradeResult.success ? tradeResult.message : tradeResult.error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="trade" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trade">Execute Trade</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="trade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Place Order - Alpaca Paper Trading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Symbol</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="AAPL"
                      value={tradeForm.symbol}
                      onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => getQuote(tradeForm.symbol)} disabled={!tradeForm.symbol}>
                      Quote
                    </Button>
                  </div>
                  {currentQuote && (
                    <div className="text-sm text-gray-600">
                      Current: ${currentQuote.currentPrice?.toFixed(2)} | Bid: ${currentQuote.quote?.bid?.toFixed(2)} |
                      Ask: ${currentQuote.quote?.ask?.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Side</label>
                  <Select
                    value={tradeForm.side}
                    onValueChange={(value: "buy" | "sell") => setTradeForm({ ...tradeForm, side: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={tradeForm.quantity}
                    onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Type</label>
                  <Select
                    value={tradeForm.orderType}
                    onValueChange={(value: "market" | "limit" | "stop") =>
                      setTradeForm({ ...tradeForm, orderType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(tradeForm.orderType === "limit" || tradeForm.orderType === "stop") && (
                <div className="grid grid-cols-2 gap-4">
                  {tradeForm.orderType === "limit" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Limit Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={tradeForm.limitPrice}
                        onChange={(e) => setTradeForm({ ...tradeForm, limitPrice: e.target.value })}
                      />
                    </div>
                  )}
                  {tradeForm.orderType === "stop" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stop Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="140.00"
                        value={tradeForm.stopPrice}
                        onChange={(e) => setTradeForm({ ...tradeForm, stopPrice: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleTrade} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing Trade...
                  </>
                ) : (
                  `${tradeForm.side.toUpperCase()} ${tradeForm.quantity} ${tradeForm.symbol || "shares"}`
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {accountInfo?.positions?.length > 0 ? (
                <div className="space-y-4">
                  {accountInfo.positions.map((position: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{position.symbol}</h3>
                        <p className="text-sm text-gray-600">
                          {position.qty} shares @ ${Number.parseFloat(position.avg_entry_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number.parseFloat(position.market_value).toLocaleString()}</p>
                        <p
                          className={`text-sm ${Number.parseFloat(position.unrealized_pl) >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {Number.parseFloat(position.unrealized_pl) >= 0 ? "+" : ""}$
                          {Number.parseFloat(position.unrealized_pl).toFixed(2)} (
                          {Number.parseFloat(position.unrealized_plpc * 100).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No open positions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {alpacaOrders.length > 0 ? (
                <div className="space-y-4">
                  {alpacaOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge
                          className={order.side === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {order.side.toUpperCase()}
                        </Badge>
                        <div>
                          <h3 className="font-semibold">{order.symbol}</h3>
                          <p className="text-sm text-gray-600">
                            {order.qty} shares • {order.order_type}
                            {order.limit_price && ` @ $${Number.parseFloat(order.limit_price).toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <div className="flex space-x-2">
                          {(order.status === "new" || order.status === "pending_new") && (
                            <Button size="sm" variant="outline" onClick={() => handleCancelOrder(order.id)}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent orders</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length > 0 ? (
                <div className="space-y-4">
                  {trades.map((trade: any) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge
                          className={trade.side === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                        <div>
                          <h3 className="font-semibold">{trade.symbol}</h3>
                          <p className="text-sm text-gray-600">
                            {trade.quantity} shares • {trade.order_type}
                          </p>
                          {trade.recommendation && (
                            <p className="text-xs text-blue-600">AI Recommendation ({trade.confidence}%)</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(trade.status)}>{trade.status}</Badge>
                        <p className="text-sm text-gray-600 mt-1">{new Date(trade.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No trades yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
