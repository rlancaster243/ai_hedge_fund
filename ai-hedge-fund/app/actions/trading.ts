"use server"

import { neon } from "@neondatabase/serverless"
import { alpacaAPI, validateAlpacaPrice } from "@/lib/alpaca"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export async function executeTradeAction(params: {
  symbol: string
  side: "buy" | "sell"
  quantity: number
  orderType: "market" | "limit" | "stop"
  limitPrice?: number
  stopPrice?: number
  aiRecommendationId?: number
}) {
  try {
    console.log("Executing trade with params:", params)

    // Get demo user (in production, use actual user authentication)
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    // Validate order parameters
    if (!params.symbol || params.quantity <= 0) {
      throw new Error("Invalid order parameters")
    }

    if (params.orderType === "limit" && !params.limitPrice) {
      throw new Error("Limit price required for limit orders")
    }

    if (params.orderType === "stop" && !params.stopPrice) {
      throw new Error("Stop price required for stop orders")
    }

    // Validate and round prices to avoid sub-penny errors
    let validatedLimitPrice: number | undefined
    let validatedStopPrice: number | undefined

    if (params.limitPrice) {
      validatedLimitPrice = validateAlpacaPrice(params.limitPrice, params.symbol)
      console.log(`Limit price validation: ${params.limitPrice} -> ${validatedLimitPrice}`)
    }

    if (params.stopPrice) {
      validatedStopPrice = validateAlpacaPrice(params.stopPrice, params.symbol)
      console.log(`Stop price validation: ${params.stopPrice} -> ${validatedStopPrice}`)
    }

    // Get current account info to check buying power
    const account = await alpacaAPI.getAccount()
    console.log("Account status:", account.status, "Buying power:", account.buying_power)

    // Create order with Alpaca Paper Trading using validated prices
    const alpacaOrder = await alpacaAPI.createOrder({
      symbol: params.symbol,
      side: params.side,
      qty: params.quantity,
      type: params.orderType,
      limit_price: validatedLimitPrice,
      stop_price: validatedStopPrice,
      time_in_force: "day",
    })

    console.log("Alpaca order response:", alpacaOrder)

    // Store trade in database with validated prices
    const trade = await sql`
      INSERT INTO trades (
        user_id, symbol, side, quantity, price, order_type, status, alpaca_order_id, executed_at
      ) VALUES (
        ${userId}, ${params.symbol.toUpperCase()}, ${params.side}, ${params.quantity}, 
        ${validatedLimitPrice || validatedStopPrice || 0}, ${params.orderType}, ${alpacaOrder.status}, ${alpacaOrder.id},
        ${alpacaOrder.status === "filled" ? new Date() : null}
      ) RETURNING *
    `

    // Update AI recommendation if provided
    if (params.aiRecommendationId) {
      await sql`
        UPDATE ai_recommendations 
        SET executed = true, trade_id = ${trade[0].id}
        WHERE id = ${params.aiRecommendationId}
      `
    }

    revalidatePath("/trading")
    revalidatePath("/trading-advisor")

    return {
      success: true,
      trade: trade[0],
      alpacaOrder,
      message: `${params.side.toUpperCase()} order for ${params.quantity} shares of ${params.symbol} ${alpacaOrder.status}`,
      validatedPrices: {
        originalLimitPrice: params.limitPrice,
        validatedLimitPrice,
        originalStopPrice: params.stopPrice,
        validatedStopPrice,
      },
    }
  } catch (error) {
    console.error("Trade execution error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute trade",
    }
  }
}

export async function getAccountInfo() {
  try {
    console.log("Fetching account info from Alpaca...")
    const account = await alpacaAPI.getAccount()
    const positions = await alpacaAPI.getPositions()
    const orders = await alpacaAPI.getOrders("all", 20)

    console.log("Account fetched:", {
      portfolio_value: account.portfolio_value,
      buying_power: account.buying_power,
      positions_count: positions.length,
      orders_count: orders.length,
    })

    return { success: true, account, positions, orders }
  } catch (error) {
    console.error("Account info error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get account info",
    }
  }
}

export async function getTradeHistory() {
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    // Get trades from database
    const trades = await sql`
      SELECT t.*, ar.recommendation, ar.confidence, ar.analysis
      FROM trades t
      LEFT JOIN ai_recommendations ar ON t.id = ar.trade_id
      WHERE t.user_id = ${userId}
      ORDER BY t.created_at DESC
      LIMIT 50
    `

    // Also get recent orders from Alpaca
    const alpacaOrders = await alpacaAPI.getOrders("all", 20)

    return { success: true, trades, alpacaOrders }
  } catch (error) {
    console.error("Trade history error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get trade history",
    }
  }
}

export async function cancelOrderAction(orderId: string) {
  try {
    await alpacaAPI.cancelOrder(orderId)

    // Update trade status in database
    await sql`
      UPDATE trades 
      SET status = 'cancelled'
      WHERE alpaca_order_id = ${orderId}
    `

    revalidatePath("/trading")
    return { success: true, message: "Order cancelled successfully" }
  } catch (error) {
    console.error("Cancel order error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    }
  }
}

export async function getMarketQuote(symbol: string) {
  try {
    const quote = await alpacaAPI.getLatestQuote(symbol)
    const trade = await alpacaAPI.getLatestTrade(symbol)

    return {
      success: true,
      quote,
      trade,
      currentPrice: trade.price,
      spread: quote.ask - quote.bid,
    }
  } catch (error) {
    console.error("Market quote error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get market quote",
    }
  }
}

export async function saveAIRecommendation(recommendation: any, marketData: any) {
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    // Validate recommendation prices before saving
    const validatedTargetPrice = validateAlpacaPrice(recommendation.targetPrice, marketData.symbol)
    const validatedStopLoss = validateAlpacaPrice(recommendation.stopLoss, marketData.symbol)

    const saved = await sql`
      INSERT INTO ai_recommendations (
        user_id, symbol, recommendation, confidence, target_price, stop_loss,
        time_horizon, risk_factors, analysis, market_data
      ) VALUES (
        ${userId}, ${marketData.symbol}, ${recommendation.recommendation}, 
        ${recommendation.confidence}, ${validatedTargetPrice}, ${validatedStopLoss},
        ${recommendation.timeHorizon}, ${recommendation.riskFactors}, 
        ${recommendation.analysis}, ${JSON.stringify(marketData)}
      ) RETURNING *
    `

    return { success: true, recommendation: saved[0] }
  } catch (error) {
    console.error("Save recommendation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save recommendation",
    }
  }
}

export async function getPortfolioPerformance() {
  try {
    const portfolioHistory = await alpacaAPI.getPortfolioHistory("1M")
    return { success: true, portfolioHistory }
  } catch (error) {
    console.error("Portfolio performance error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get portfolio performance",
    }
  }
}
