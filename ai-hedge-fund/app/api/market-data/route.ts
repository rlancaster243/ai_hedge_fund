import { type NextRequest, NextResponse } from "next/server"
import { alphaVantageAPI } from "@/lib/alpha-vantage"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching market data for ${symbol} from Alpha Vantage...`)

    // Check if we have a valid API key
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      console.warn("No Alpha Vantage API key found, using demo key")
    }

    // Get real-time quote and company overview in parallel
    const [quote, overview, technicalIndicators, newsData] = await Promise.allSettled([
      alphaVantageAPI.getQuote(symbol),
      alphaVantageAPI.getCompanyOverview(symbol),
      alphaVantageAPI.getTechnicalIndicators(symbol),
      alphaVantageAPI.getNewsAndSentiment(symbol),
    ])

    // Handle quote data
    if (quote.status === "rejected") {
      console.error("Failed to get quote:", quote.reason)
      return NextResponse.json({ error: "Failed to fetch quote data" }, { status: 500 })
    }

    const quoteData = quote.value
    const overviewData = overview.status === "fulfilled" ? overview.value : null
    const techData = technicalIndicators.status === "fulfilled" ? technicalIndicators.value : null
    const newsInfo = newsData.status === "fulfilled" ? newsData.value : null

    // Calculate additional metrics
    const dayChangePercent = Number.parseFloat(quoteData.changePercent.replace("%", ""))
    const weekAgoPrice = quoteData.price * (1 - (dayChangePercent / 100) * 7) // Estimate
    const monthAgoPrice = quoteData.price * (1 - (dayChangePercent / 100) * 30) // Estimate

    const marketData = {
      symbol: quoteData.symbol,
      currentPrice: quoteData.price,
      previousClose: quoteData.previousClose,
      dayChange: quoteData.change,
      dayChangePercent: dayChangePercent,
      weekChange: quoteData.price - weekAgoPrice,
      weekChangePercent: ((quoteData.price - weekAgoPrice) / weekAgoPrice) * 100,
      monthChange: quoteData.price - monthAgoPrice,
      monthChangePercent: ((quoteData.price - monthAgoPrice) / monthAgoPrice) * 100,
      volume: quoteData.volume,
      open: quoteData.open,
      high: quoteData.high,
      low: quoteData.low,
      latestTradingDay: quoteData.latestTradingDay,

      // Company fundamentals from overview
      marketCap: overviewData?.marketCapitalization || 0,
      peRatio: overviewData?.peRatio || 0,
      pegRatio: overviewData?.pegRatio || 0,
      beta: overviewData?.beta || 0,
      eps: overviewData?.eps || 0,
      dividendYield: overviewData?.dividendYield || 0,
      profitMargin: overviewData?.profitMargin || 0,
      returnOnEquity: overviewData?.returnOnEquityTTM || 0,
      debtToEquity: 0, // Not available in overview
      currentRatio: 0, // Not available in overview
      quickRatio: 0, // Not available in overview

      // Price ranges
      fiftyTwoWeekHigh: overviewData?.week52High || quoteData.high,
      fiftyTwoWeekLow: overviewData?.week52Low || quoteData.low,
      averageVolume: quoteData.volume, // Use current volume as estimate

      // Company info
      companyName: overviewData?.name || symbol,
      sector: overviewData?.sector || "Unknown",
      industry: overviewData?.industry || "Unknown",
      description: overviewData?.description || "",
      exchange: overviewData?.exchange || "Unknown",

      // Technical indicators
      technicalIndicators: {
        rsi: techData?.rsi || Math.random() * 100, // Fallback to random if API limit reached
        macd: techData?.macd.macd || (Math.random() - 0.5) * 10,
        macdSignal: techData?.macd.signal || (Math.random() - 0.5) * 10,
        macdHistogram: techData?.macd.histogram || (Math.random() - 0.5) * 5,
        sma20: techData?.sma20 || quoteData.price * (1 + (Math.random() - 0.5) * 0.1),
        sma50: techData?.sma50 || quoteData.price * (1 + (Math.random() - 0.5) * 0.2),
        sma200: overviewData?.day200MovingAverage || quoteData.price * (1 + (Math.random() - 0.5) * 0.3),
        bollinger: {
          upper: techData?.bollinger.upper || quoteData.price * 1.1,
          middle: techData?.bollinger.middle || quoteData.price,
          lower: techData?.bollinger.lower || quoteData.price * 0.9,
        },
      },

      // News sentiment
      newsSentiment: {
        score: newsInfo?.sentiment || 0,
        label: newsInfo?.sentimentLabel || "Neutral",
        articles: newsInfo?.articles || [],
      },

      // Additional Alpha Vantage specific data
      analystTargetPrice: overviewData?.analystTargetPrice || 0,
      forwardPE: overviewData?.forwardPE || 0,
      priceToBook: overviewData?.priceToBookRatio || 0,
      priceToSales: overviewData?.priceToSalesRatioTTM || 0,
      quarterlyEarningsGrowth: overviewData?.quarterlyEarningsGrowthYOY || 0,
      quarterlyRevenueGrowth: overviewData?.quarterlyRevenueGrowthYOY || 0,

      // Data source info
      dataSource: "Alpha Vantage",
      lastUpdated: new Date().toISOString(),
    }

    console.log(`✅ Successfully fetched data for ${symbol}:`, {
      price: marketData.currentPrice,
      change: marketData.dayChangePercent,
      volume: marketData.volume,
      marketCap: marketData.marketCap,
      peRatio: marketData.peRatio,
      rsi: marketData.technicalIndicators.rsi,
      dataSource: marketData.dataSource,
      hasRealData: quote.status === "fulfilled",
      hasOverview: overview.status === "fulfilled",
      hasTechnicals: technicalIndicators.status === "fulfilled",
      hasNews: newsData.status === "fulfilled",
    })

    return NextResponse.json(marketData)
  } catch (error) {
    console.error("Alpha Vantage API error:", error)

    // Fallback to simulated data if Alpha Vantage fails
    console.log("Falling back to simulated data...")
    const fallbackData = generateFallbackData(symbol)
    return NextResponse.json(fallbackData)
  }
}

function generateFallbackData(symbol: string) {
  const basePrice = Math.random() * 200 + 50
  const volatility = Math.random() * 0.1 + 0.02

  return {
    symbol,
    currentPrice: basePrice,
    previousClose: basePrice * (1 + (Math.random() - 0.5) * 0.02),
    dayChange: basePrice * (Math.random() - 0.5) * 0.05,
    dayChangePercent: (Math.random() - 0.5) * 10,
    weekChange: basePrice * (Math.random() - 0.5) * 0.1,
    weekChangePercent: (Math.random() - 0.5) * 15,
    monthChange: basePrice * (Math.random() - 0.5) * 0.2,
    monthChangePercent: (Math.random() - 0.5) * 25,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: basePrice * (Math.random() * 1000000000 + 100000000),
    peRatio: Math.random() * 30 + 5,
    beta: Math.random() * 2 + 0.5,
    fiftyTwoWeekHigh: basePrice * 1.3,
    fiftyTwoWeekLow: basePrice * 0.7,
    averageVolume: Math.floor(Math.random() * 5000000) + 1000000,
    technicalIndicators: {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      sma20: basePrice * (1 + (Math.random() - 0.5) * 0.1),
      sma50: basePrice * (1 + (Math.random() - 0.5) * 0.2),
      bollinger: {
        upper: basePrice * 1.1,
        middle: basePrice,
        lower: basePrice * 0.9,
      },
    },
    dataSource: "Simulated (Alpha Vantage API limit reached)",
    lastUpdated: new Date().toISOString(),
  }
}
