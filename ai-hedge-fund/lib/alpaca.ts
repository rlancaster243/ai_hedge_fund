export interface AlpacaOrder {
  id: string
  symbol: string
  side: "buy" | "sell"
  qty: string
  order_type: "market" | "limit" | "stop"
  time_in_force: "day" | "gtc"
  limit_price?: string
  stop_price?: string
  status: string
  filled_at?: string
  filled_qty?: string
  filled_avg_price?: string
  created_at: string
  updated_at: string
}

export interface AlpacaPosition {
  symbol: string
  qty: string
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  current_price: string
  side: "long" | "short"
  avg_entry_price: string
}

export interface AlpacaAccount {
  id: string
  account_number: string
  status: string
  currency: string
  buying_power: string
  cash: string
  portfolio_value: string
  equity: string
  last_equity: string
  multiplier: string
  initial_margin: string
  maintenance_margin: string
  last_maintenance_margin: string
  long_market_value: string
  short_market_value: string
  daytrading_buying_power: string
  regt_buying_power: string
  created_at: string
  trading_blocked: boolean
  transfers_blocked: boolean
  account_blocked: boolean
  pattern_day_trader: boolean
}

// Utility function to round prices to valid Alpaca increments
function roundToValidPrice(price: number): number {
  // Alpaca requires prices to be in penny increments (2 decimal places)
  // Round to 2 decimal places to avoid sub-penny issues
  return Math.round(price * 100) / 100
}

// Utility function to validate and adjust price for Alpaca requirements
function validateAlpacaPrice(price: number, symbol: string): number {
  const roundedPrice = roundToValidPrice(price)

  // Additional validation for different price ranges
  if (roundedPrice < 0.01) {
    console.warn(`Price ${price} too low for ${symbol}, setting to $0.01`)
    return 0.01
  }

  if (roundedPrice > 100000) {
    console.warn(`Price ${price} too high for ${symbol}, capping at $100,000`)
    return 100000
  }

  return roundedPrice
}

class AlpacaAPI {
  private baseURL: string
  private dataURL: string
  private headers: HeadersInit

  constructor() {
    // Use paper trading URLs
    this.baseURL = "https://paper-api.alpaca.markets"
    this.dataURL = "https://data.alpaca.markets"
    this.headers = {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY!,
      "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
      "Content-Type": "application/json",
    }
  }

  async getAccount(): Promise<AlpacaAccount> {
    const response = await fetch(`${this.baseURL}/v2/account`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await fetch(`${this.baseURL}/v2/positions`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      const response = await fetch(`${this.baseURL}/v2/positions/${symbol}`, {
        headers: this.headers,
      })

      if (response.status === 404) {
        return null // No position found
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null
      }
      throw error
    }
  }

  async createOrder(order: {
    symbol: string
    side: "buy" | "sell"
    qty: number
    type: "market" | "limit" | "stop"
    time_in_force?: "day" | "gtc"
    limit_price?: number
    stop_price?: number
  }): Promise<AlpacaOrder> {
    // Validate and round prices to avoid sub-penny errors
    const orderData: any = {
      symbol: order.symbol.toUpperCase(),
      side: order.side,
      qty: order.qty.toString(),
      type: order.type,
      time_in_force: order.time_in_force || "day",
    }

    // Add limit price if specified, with proper rounding
    if (order.limit_price) {
      const validLimitPrice = validateAlpacaPrice(order.limit_price, order.symbol)
      orderData.limit_price = validLimitPrice.toFixed(2)
      console.log(`Original limit price: ${order.limit_price}, Rounded: ${validLimitPrice}`)
    }

    // Add stop price if specified, with proper rounding
    if (order.stop_price) {
      const validStopPrice = validateAlpacaPrice(order.stop_price, order.symbol)
      orderData.stop_price = validStopPrice.toFixed(2)
      console.log(`Original stop price: ${order.stop_price}, Rounded: ${validStopPrice}`)
    }

    console.log("Creating Alpaca order with validated data:", orderData)

    const response = await fetch(`${this.baseURL}/v2/orders`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Alpaca order error details:", error)
      throw new Error(`Alpaca order error: ${error.message || response.statusText}`)
    }

    const result = await response.json()
    console.log("Alpaca order created successfully:", result)
    return result
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await fetch(`${this.baseURL}/v2/orders/${orderId}`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getOrders(status?: string, limit = 50): Promise<AlpacaOrder[]> {
    const url = new URL(`${this.baseURL}/v2/orders`)
    if (status) {
      url.searchParams.append("status", status)
    }
    url.searchParams.append("limit", limit.toString())
    url.searchParams.append("direction", "desc") // Most recent first

    const response = await fetch(url.toString(), {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async cancelOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/v2/orders/${orderId}`, {
      method: "DELETE",
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }
  }

  async cancelAllOrders(): Promise<void> {
    const response = await fetch(`${this.baseURL}/v2/orders`, {
      method: "DELETE",
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }
  }

  async getLatestQuote(symbol: string): Promise<{ bid: number; ask: number; timestamp: string }> {
    const response = await fetch(`${this.dataURL}/v2/stocks/${symbol}/quotes/latest`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca data API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return {
      bid: data.quote.bp,
      ask: data.quote.ap,
      timestamp: data.quote.t,
    }
  }

  async getLatestTrade(symbol: string): Promise<{ price: number; size: number; timestamp: string }> {
    const response = await fetch(`${this.dataURL}/v2/stocks/${symbol}/trades/latest`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca data API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return {
      price: data.trade.p,
      size: data.trade.s,
      timestamp: data.trade.t,
    }
  }

  async getPortfolioHistory(period = "1M"): Promise<any> {
    const response = await fetch(`${this.baseURL}/v2/account/portfolio/history?period=${period}`, {
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }
}

export const alpacaAPI = new AlpacaAPI()
export { roundToValidPrice, validateAlpacaPrice }
