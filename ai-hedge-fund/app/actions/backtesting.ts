"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export async function createBacktestAction(params: {
  name: string
  strategyCode: string
  startDate: string
  endDate: string
  initialCapital: number
  symbols?: string[]
}) {
  try {
    // Automatically detect the base URL
    const getBaseUrl = () => {
      if (typeof window !== "undefined") {
        // Client-side: use current origin
        return window.location.origin
      }

      // Server-side: detect environment
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
      }

      if (process.env.NODE_ENV === "production") {
        // Fallback for production
        return "https://your-app.vercel.app" // This will be auto-detected in most cases
      }

      // Development fallback
      return "http://localhost:3000"
    }

    const baseUrl = getBaseUrl()

    const response = await fetch(`${baseUrl}/api/backtest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create backtest")
    }

    const result = await response.json()
    revalidatePath("/backtesting")

    return result
  } catch (error) {
    console.error("Backtest creation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create backtest",
    }
  }
}

export async function getBacktestHistory() {
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    const backtests = await sql`
      SELECT b.*, ts.name as strategy_name
      FROM backtests b
      LEFT JOIN trading_strategies ts ON b.strategy_id = ts.id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT 20
    `

    return { success: true, backtests }
  } catch (error) {
    console.error("Backtest history error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get backtest history",
    }
  }
}

export async function getBacktestDetails(backtestId: number) {
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    const backtest = await sql`
      SELECT b.*, ts.name as strategy_name, ts.strategy_code
      FROM backtests b
      LEFT JOIN trading_strategies ts ON b.strategy_id = ts.id
      WHERE b.id = ${backtestId} AND b.user_id = ${userId}
    `

    if (backtest.length === 0) {
      throw new Error("Backtest not found")
    }

    return { success: true, backtest: backtest[0] }
  } catch (error) {
    console.error("Backtest details error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get backtest details",
    }
  }
}

export async function deleteBacktest(backtestId: number) {
  try {
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      throw new Error("User not found")
    }

    await sql`
      DELETE FROM backtests 
      WHERE id = ${backtestId} AND user_id = ${userId}
    `

    revalidatePath("/backtesting")
    return { success: true }
  } catch (error) {
    console.error("Delete backtest error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete backtest",
    }
  }
}
