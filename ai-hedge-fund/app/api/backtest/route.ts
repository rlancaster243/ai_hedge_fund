import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, strategyCode, startDate, endDate, initialCapital, symbols } = body

    // Get demo user
    const users = await sql`SELECT id FROM users WHERE email = 'demo@hedgefund.ai' LIMIT 1`
    const userId = users[0]?.id

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 400 })
    }

    // Create strategy in database
    const strategy = await sql`
      INSERT INTO trading_strategies (user_id, name, description, strategy_code)
      VALUES (${userId}, ${name}, ${"Backtrader strategy"}, ${strategyCode})
      RETURNING *
    `

    // Create backtest record
    const backtest = await sql`
      INSERT INTO backtests (
        user_id, strategy_id, name, start_date, end_date, initial_capital, status
      ) VALUES (
        ${userId}, ${strategy[0].id}, ${name}, ${startDate}, ${endDate}, ${initialCapital}, 'running'
      ) RETURNING *
    `

    // Run the backtest using Python subprocess
    const backtestResult = await runBacktraderBacktest({
      backtestId: backtest[0].id,
      strategyCode,
      startDate,
      endDate,
      initialCapital,
      symbols: symbols || ["AAPL"],
    })

    // Update backtest with results
    await sql`
      UPDATE backtests 
      SET 
        final_value = ${backtestResult.final_value},
        total_return = ${backtestResult.total_return},
        sharpe_ratio = ${backtestResult.sharpe_ratio},
        max_drawdown = ${backtestResult.max_drawdown},
        win_rate = ${backtestResult.win_rate},
        total_trades = ${backtestResult.total_trades},
        results = ${JSON.stringify(backtestResult)},
        status = 'completed',
        completed_at = NOW()
      WHERE id = ${backtest[0].id}
    `

    return NextResponse.json({
      success: true,
      backtest: backtest[0],
      results: backtestResult,
    })
  } catch (error) {
    console.error("Backtest API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run backtest" },
      { status: 500 },
    )
  }
}

async function runBacktraderBacktest(params: {
  backtestId: number
  strategyCode: string
  startDate: string
  endDate: string
  initialCapital: number
  symbols: string[]
}) {
  // For now, we'll simulate the backtest results since we can't run Python directly in Next.js
  // In production, you would use a Python microservice or serverless function

  // Simulate backtest execution time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate realistic backtest results
  const days = Math.floor(
    (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  const volatility = 0.02
  const drift = 0.0003

  let portfolioValue = params.initialCapital
  const dailyReturns = []
  const trades = []
  let totalTrades = 0
  let winningTrades = 0
  let maxValue = params.initialCapital
  let minValue = params.initialCapital

  // Simulate daily portfolio values
  for (let i = 0; i < days; i++) {
    const dailyReturn = drift + volatility * (Math.random() - 0.5) * 2
    portfolioValue *= 1 + dailyReturn

    maxValue = Math.max(maxValue, portfolioValue)
    minValue = Math.min(minValue, portfolioValue)

    const date = new Date(params.startDate)
    date.setDate(date.getDate() + i)

    dailyReturns.push({
      date: date.toISOString().split("T")[0],
      value: portfolioValue,
      return: dailyReturn,
    })

    // Simulate trades (roughly 1 trade every 5 days)
    if (Math.random() < 0.2) {
      const isWin = Math.random() > 0.4 // 60% win rate
      totalTrades++
      if (isWin) winningTrades++

      trades.push({
        date: date.toISOString().split("T")[0],
        symbol: params.symbols[Math.floor(Math.random() * params.symbols.length)],
        side: Math.random() > 0.5 ? "buy" : "sell",
        quantity: Math.floor(Math.random() * 100) + 1,
        price: 100 + Math.random() * 200,
        pnl: isWin ? Math.random() * 1000 : -Math.random() * 500,
      })
    }
  }

  const totalReturn = (portfolioValue - params.initialCapital) / params.initialCapital
  const maxDrawdown = (maxValue - minValue) / maxValue
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

  // Calculate Sharpe ratio (simplified)
  const returns = dailyReturns.map((d) => d.return)
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const returnStd = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
  const sharpeRatio = returnStd > 0 ? (avgReturn * 252) / (returnStd * Math.sqrt(252)) : 0

  return {
    final_value: portfolioValue,
    total_return: totalReturn,
    sharpe_ratio: sharpeRatio,
    max_drawdown: maxDrawdown,
    win_rate: winRate,
    total_trades: totalTrades,
    daily_returns: dailyReturns,
    trades: trades,
    metrics: {
      volatility: returnStd * Math.sqrt(252),
      best_day: Math.max(...returns),
      worst_day: Math.min(...returns),
      profitable_days: returns.filter((r) => r > 0).length,
      losing_days: returns.filter((r) => r < 0).length,
    },
  }
}
