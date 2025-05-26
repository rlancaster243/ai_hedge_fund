"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function getTradingAdvice(symbol: string, marketData: any) {
  try {
    const prompt = `
You are an expert financial analyst and trading advisor. Analyze the following comprehensive market data for ${symbol} and provide detailed trading advice.

REAL-TIME MARKET DATA (Alpha Vantage):
- Current Price: $${marketData.currentPrice?.toFixed(2)}
- Day Change: ${marketData.dayChangePercent?.toFixed(2)}%
- Week Change: ${marketData.weekChangePercent?.toFixed(2)}%
- Month Change: ${marketData.monthChangePercent?.toFixed(2)}%
- Volume: ${marketData.volume?.toLocaleString()}
- Average Volume: ${marketData.averageVolume?.toLocaleString()}

COMPANY FUNDAMENTALS:
- Market Cap: $${(marketData.marketCap / 1000000000)?.toFixed(2)}B
- P/E Ratio: ${marketData.peRatio?.toFixed(2)}
- PEG Ratio: ${marketData.pegRatio?.toFixed(2)}
- Beta: ${marketData.beta?.toFixed(2)}
- EPS: $${marketData.eps?.toFixed(2)}
- Dividend Yield: ${marketData.dividendYield?.toFixed(2)}%
- Profit Margin: ${marketData.profitMargin?.toFixed(2)}%
- ROE: ${marketData.returnOnEquity?.toFixed(2)}%
- 52-Week High: $${marketData.fiftyTwoWeekHigh?.toFixed(2)}
- 52-Week Low: $${marketData.fiftyTwoWeekLow?.toFixed(2)}

COMPANY PROFILE:
- Name: ${marketData.companyName || symbol}
- Sector: ${marketData.sector || "Unknown"}
- Industry: ${marketData.industry || "Unknown"}
- Exchange: ${marketData.exchange || "Unknown"}

TECHNICAL INDICATORS:
- RSI (14): ${marketData.technicalIndicators?.rsi?.toFixed(2)}
- MACD: ${marketData.technicalIndicators?.macd?.toFixed(2)}
- MACD Signal: ${marketData.technicalIndicators?.macdSignal?.toFixed(2)}
- 20-day SMA: $${marketData.technicalIndicators?.sma20?.toFixed(2)}
- 50-day SMA: $${marketData.technicalIndicators?.sma50?.toFixed(2)}
- 200-day SMA: $${marketData.technicalIndicators?.sma200?.toFixed(2)}
- Bollinger Upper: $${marketData.technicalIndicators?.bollinger?.upper?.toFixed(2)}
- Bollinger Lower: $${marketData.technicalIndicators?.bollinger?.lower?.toFixed(2)}

ADVANCED METRICS:
- Analyst Target Price: $${marketData.analystTargetPrice?.toFixed(2)}
- Forward P/E: ${marketData.forwardPE?.toFixed(2)}
- Price-to-Book: ${marketData.priceToBook?.toFixed(2)}
- Price-to-Sales: ${marketData.priceToSales?.toFixed(2)}
- Quarterly Earnings Growth: ${marketData.quarterlyEarningsGrowth?.toFixed(2)}%
- Quarterly Revenue Growth: ${marketData.quarterlyRevenueGrowth?.toFixed(2)}%

NEWS SENTIMENT:
- Sentiment Score: ${marketData.newsSentiment?.score?.toFixed(2)}
- Sentiment Label: ${marketData.newsSentiment?.label}
- Recent Articles: ${marketData.newsSentiment?.articles?.length || 0} articles analyzed

DATA SOURCE: ${marketData.dataSource} (Last Updated: ${marketData.lastUpdated})

Please provide a comprehensive trading recommendation considering:
1. Technical analysis (RSI, MACD, moving averages, Bollinger bands)
2. Fundamental analysis (valuation metrics, growth rates, profitability)
3. Market sentiment and news analysis
4. Risk assessment based on volatility and beta
5. Sector and industry trends
6. Price momentum and volume analysis

Format your response as JSON with the following structure:
{
  "recommendation": "BUY/SELL/HOLD",
  "confidence": 85,
  "targetPrice": 150.00,
  "stopLoss": 140.00,
  "timeHorizon": "Short/Medium/Long term",
  "riskFactors": ["Market volatility", "Sector rotation", "Earnings risk"],
  "analysis": "Detailed multi-paragraph analysis incorporating all the data points above..."
}
`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.3,
    })

    // Clean the text and extract JSON more robustly
    let cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
    cleanedText = cleanedText.replace(/\n/g, " ").replace(/\r/g, " ") // Replace newlines

    // Try to find and parse JSON
    const jsonMatch = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])

        // Validate the parsed object has required fields
        if (parsed.recommendation && parsed.confidence && parsed.analysis) {
          return {
            recommendation: parsed.recommendation,
            confidence: Number(parsed.confidence),
            targetPrice: Number(parsed.targetPrice) || marketData.currentPrice * 1.05,
            stopLoss: Number(parsed.stopLoss) || marketData.currentPrice * 0.95,
            timeHorizon: parsed.timeHorizon || "Medium term",
            riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : ["Market volatility"],
            analysis: parsed.analysis,
          }
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
      }
    }

    // Enhanced fallback with better analysis using Alpha Vantage data
    const recommendation = text.includes("BUY") ? "BUY" : text.includes("SELL") ? "SELL" : "HOLD"
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)/i)
    const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1]) : 75

    // Use technical indicators for better fallback recommendations
    const rsi = marketData.technicalIndicators?.rsi || 50
    const priceVsSMA20 = marketData.currentPrice / (marketData.technicalIndicators?.sma20 || marketData.currentPrice)
    const sentiment = marketData.newsSentiment?.score || 0

    let fallbackRecommendation = "HOLD"
    let fallbackConfidence = 60

    if (rsi < 30 && priceVsSMA20 < 0.95 && sentiment > 0.1) {
      fallbackRecommendation = "BUY"
      fallbackConfidence = 75
    } else if (rsi > 70 && priceVsSMA20 > 1.05 && sentiment < -0.1) {
      fallbackRecommendation = "SELL"
      fallbackConfidence = 75
    }

    return {
      recommendation: recommendation || fallbackRecommendation,
      confidence: confidence || fallbackConfidence,
      targetPrice:
        marketData.analystTargetPrice ||
        marketData.currentPrice * (recommendation === "BUY" ? 1.08 : recommendation === "SELL" ? 0.92 : 1.02),
      stopLoss: marketData.currentPrice * (recommendation === "BUY" ? 0.95 : recommendation === "SELL" ? 1.05 : 0.98),
      timeHorizon: "Medium term",
      riskFactors: [
        "Market volatility",
        "Sector-specific risks",
        marketData.beta > 1.5 ? "High beta risk" : "Moderate beta risk",
        marketData.peRatio > 25 ? "High valuation risk" : "Reasonable valuation",
      ],
      analysis: `Analysis based on Alpha Vantage data: ${symbol} is trading at $${marketData.currentPrice?.toFixed(2)} with RSI of ${rsi?.toFixed(1)} and P/E ratio of ${marketData.peRatio?.toFixed(1)}. ${text.substring(0, 400)}...`,
    }
  } catch (error) {
    console.error("Error getting trading advice:", error)
    throw new Error("Failed to get trading advice")
  }
}
