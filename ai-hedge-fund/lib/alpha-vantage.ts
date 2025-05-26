export interface AlphaVantageQuote {
  symbol: string
  open: number
  high: number
  low: number
  price: number
  volume: number
  latestTradingDay: string
  previousClose: number
  change: number
  changePercent: string
}

export interface AlphaVantageOverview {
  symbol: string
  name: string
  description: string
  exchange: string
  currency: string
  country: string
  sector: string
  industry: string
  marketCapitalization: number
  peRatio: number
  pegRatio: number
  bookValue: number
  dividendPerShare: number
  dividendYield: number
  eps: number
  revenuePerShareTTM: number
  profitMargin: number
  operatingMarginTTM: number
  returnOnAssetsTTM: number
  returnOnEquityTTM: number
  revenueTTM: number
  grossProfitTTM: number
  dilutedEPSTTM: number
  quarterlyEarningsGrowthYOY: number
  quarterlyRevenueGrowthYOY: number
  analystTargetPrice: number
  trailingPE: number
  forwardPE: number
  priceToSalesRatioTTM: number
  priceToBookRatio: number
  evToRevenue: number
  evToEbitda: number
  beta: number
  week52High: number
  week52Low: number
  day50MovingAverage: number
  day200MovingAverage: number
  sharesOutstanding: number
  dividendDate: string
  exDividendDate: string
}

export interface AlphaVantageTechnicalIndicators {
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  sma20: number
  sma50: number
  sma200: number
  ema12: number
  ema26: number
  bollinger: {
    upper: number
    middle: number
    lower: number
  }
  stoch: {
    slowK: number
    slowD: number
  }
  adx: number
  cci: number
  aroon: {
    aroonUp: number
    aroonDown: number
  }
  obv: number
}

class AlphaVantageAPI {
  private apiKey: string
  private baseURL = "https://www.alphavantage.co/query"

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY!
    if (!this.apiKey) {
      console.warn("ALPHA_VANTAGE_API_KEY not found, using demo key")
      this.apiKey = "DE01GXDQA3UZJPWG" // Demo key fallback
    }
  }

  private async makeRequest(params: Record<string, string>) {
    const url = new URL(this.baseURL)
    url.searchParams.append("apikey", this.apiKey)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    console.log("Alpha Vantage API request:", url.toString().replace(this.apiKey, "***"))

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data["Error Message"]) {
      throw new Error(`Alpha Vantage API error: ${data["Error Message"]}`)
    }

    if (data["Note"]) {
      throw new Error(`Alpha Vantage API rate limit: ${data["Note"]}`)
    }

    return data
  }

  async getQuote(symbol: string): Promise<AlphaVantageQuote> {
    const data = await this.makeRequest({
      function: "GLOBAL_QUOTE",
      symbol: symbol.toUpperCase(),
    })

    const quote = data["Global Quote"]
    if (!quote) {
      throw new Error("No quote data available")
    }

    return {
      symbol: quote["01. symbol"],
      open: Number.parseFloat(quote["02. open"]),
      high: Number.parseFloat(quote["03. high"]),
      low: Number.parseFloat(quote["04. low"]),
      price: Number.parseFloat(quote["05. price"]),
      volume: Number.parseInt(quote["06. volume"]),
      latestTradingDay: quote["07. latest trading day"],
      previousClose: Number.parseFloat(quote["08. previous close"]),
      change: Number.parseFloat(quote["09. change"]),
      changePercent: quote["10. change percent"],
    }
  }

  async getCompanyOverview(symbol: string): Promise<AlphaVantageOverview> {
    const data = await this.makeRequest({
      function: "OVERVIEW",
      symbol: symbol.toUpperCase(),
    })

    return {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      exchange: data.Exchange,
      currency: data.Currency,
      country: data.Country,
      sector: data.Sector,
      industry: data.Industry,
      marketCapitalization: Number.parseInt(data.MarketCapitalization) || 0,
      peRatio: Number.parseFloat(data.PERatio) || 0,
      pegRatio: Number.parseFloat(data.PEGRatio) || 0,
      bookValue: Number.parseFloat(data.BookValue) || 0,
      dividendPerShare: Number.parseFloat(data.DividendPerShare) || 0,
      dividendYield: Number.parseFloat(data.DividendYield) || 0,
      eps: Number.parseFloat(data.EPS) || 0,
      revenuePerShareTTM: Number.parseFloat(data.RevenuePerShareTTM) || 0,
      profitMargin: Number.parseFloat(data.ProfitMargin) || 0,
      operatingMarginTTM: Number.parseFloat(data.OperatingMarginTTM) || 0,
      returnOnAssetsTTM: Number.parseFloat(data.ReturnOnAssetsTTM) || 0,
      returnOnEquityTTM: Number.parseFloat(data.ReturnOnEquityTTM) || 0,
      revenueTTM: Number.parseInt(data.RevenueTTM) || 0,
      grossProfitTTM: Number.parseInt(data.GrossProfitTTM) || 0,
      dilutedEPSTTM: Number.parseFloat(data.DilutedEPSTTM) || 0,
      quarterlyEarningsGrowthYOY: Number.parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
      quarterlyRevenueGrowthYOY: Number.parseFloat(data.QuarterlyRevenueGrowthYOY) || 0,
      analystTargetPrice: Number.parseFloat(data.AnalystTargetPrice) || 0,
      trailingPE: Number.parseFloat(data.TrailingPE) || 0,
      forwardPE: Number.parseFloat(data.ForwardPE) || 0,
      priceToSalesRatioTTM: Number.parseFloat(data.PriceToSalesRatioTTM) || 0,
      priceToBookRatio: Number.parseFloat(data.PriceToBookRatio) || 0,
      evToRevenue: Number.parseFloat(data.EVToRevenue) || 0,
      evToEbitda: Number.parseFloat(data.EVToEBITDA) || 0,
      beta: Number.parseFloat(data.Beta) || 0,
      week52High: Number.parseFloat(data["52WeekHigh"]) || 0,
      week52Low: Number.parseFloat(data["52WeekLow"]) || 0,
      day50MovingAverage: Number.parseFloat(data["50DayMovingAverage"]) || 0,
      day200MovingAverage: Number.parseFloat(data["200DayMovingAverage"]) || 0,
      sharesOutstanding: Number.parseInt(data.SharesOutstanding) || 0,
      dividendDate: data.DividendDate,
      exDividendDate: data.ExDividendDate,
    }
  }

  async getTechnicalIndicators(symbol: string): Promise<AlphaVantageTechnicalIndicators> {
    // Get multiple technical indicators
    const [rsiData, macdData, sma20Data, sma50Data, bollingerData] = await Promise.allSettled([
      this.makeRequest({
        function: "RSI",
        symbol: symbol.toUpperCase(),
        interval: "daily",
        time_period: "14",
        series_type: "close",
      }),
      this.makeRequest({
        function: "MACD",
        symbol: symbol.toUpperCase(),
        interval: "daily",
        series_type: "close",
      }),
      this.makeRequest({
        function: "SMA",
        symbol: symbol.toUpperCase(),
        interval: "daily",
        series_type: "close",
      }),
      this.makeRequest({
        function: "SMA",
        symbol: symbol.toUpperCase(),
        interval: "daily",
        time_period: "50",
        series_type: "close",
      }),
      this.makeRequest({
        function: "BBANDS",
        symbol: symbol.toUpperCase(),
        interval: "daily",
        time_period: "20",
        series_type: "close",
      }),
    ])

    // Extract latest values from each indicator
    const getLatestValue = (result: any, dataKey: string, valueKey: string) => {
      if (result.status === "fulfilled" && result.value[dataKey]) {
        const dates = Object.keys(result.value[dataKey])
        const latestDate = dates[0] // Alpha Vantage returns data in descending order
        return Number.parseFloat(result.value[dataKey][latestDate][valueKey]) || 0
      }
      return 0
    }

    const rsi = getLatestValue(rsiData, "Technical Analysis: RSI", "RSI")
    const macd = getLatestValue(macdData, "Technical Analysis: MACD", "MACD")
    const macdSignal = getLatestValue(macdData, "Technical Analysis: MACD", "MACD_Signal")
    const macdHist = getLatestValue(macdData, "Technical Analysis: MACD", "MACD_Hist")
    const sma20 = getLatestValue(sma20Data, "Technical Analysis: SMA", "SMA")
    const sma50 = getLatestValue(sma50Data, "Technical Analysis: SMA", "SMA")
    const bollingerUpper = getLatestValue(bollingerData, "Technical Analysis: BBANDS", "Real Upper Band")
    const bollingerMiddle = getLatestValue(bollingerData, "Technical Analysis: BBANDS", "Real Middle Band")
    const bollingerLower = getLatestValue(bollingerData, "Technical Analysis: BBANDS", "Real Lower Band")

    return {
      rsi,
      macd: {
        macd,
        signal: macdSignal,
        histogram: macdHist,
      },
      sma20,
      sma50,
      sma200: 0, // Would need separate API call
      ema12: 0, // Would need separate API call
      ema26: 0, // Would need separate API call
      bollinger: {
        upper: bollingerUpper,
        middle: bollingerMiddle,
        lower: bollingerLower,
      },
      stoch: {
        slowK: 0, // Would need separate API call
        slowD: 0, // Would need separate API call
      },
      adx: 0, // Would need separate API call
      cci: 0, // Would need separate API call
      aroon: {
        aroonUp: 0, // Would need separate API call
        aroonDown: 0, // Would need separate API call
      },
      obv: 0, // Would need separate API call
    }
  }

  async getIntradayData(symbol: string, interval: "1min" | "5min" | "15min" | "30min" | "60min" = "5min") {
    const data = await this.makeRequest({
      function: "TIME_SERIES_INTRADAY",
      symbol: symbol.toUpperCase(),
      interval,
      outputsize: "compact",
    })

    const timeSeriesKey = `Time Series (${interval})`
    const timeSeries = data[timeSeriesKey]

    if (!timeSeries) {
      throw new Error("No intraday data available")
    }

    // Convert to array format
    const prices = Object.entries(timeSeries).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: Number.parseFloat(values["1. open"]),
      high: Number.parseFloat(values["2. high"]),
      low: Number.parseFloat(values["3. low"]),
      close: Number.parseFloat(values["4. close"]),
      volume: Number.parseInt(values["5. volume"]),
    }))

    return prices.slice(0, 100) // Return last 100 data points
  }

  async getNewsAndSentiment(symbol: string) {
    try {
      const data = await this.makeRequest({
        function: "NEWS_SENTIMENT",
        tickers: symbol.toUpperCase(),
        limit: "10",
      })

      return {
        sentiment: data.overall_sentiment_score || 0,
        sentimentLabel: data.overall_sentiment_label || "Neutral",
        articles:
          data.feed?.slice(0, 5).map((article: any) => ({
            title: article.title,
            summary: article.summary,
            url: article.url,
            timePublished: article.time_published,
            sentiment: article.overall_sentiment_score,
            sentimentLabel: article.overall_sentiment_label,
          })) || [],
      }
    } catch (error) {
      console.warn("News sentiment not available:", error)
      return {
        sentiment: 0,
        sentimentLabel: "Neutral",
        articles: [],
      }
    }
  }

  async checkAPIStatus(): Promise<{ status: string; callsRemaining?: number }> {
    try {
      const data = await this.makeRequest({
        function: "GLOBAL_QUOTE",
        symbol: "AAPL",
      })

      return {
        status: "active",
        callsRemaining: data["Meta Data"]?.["API Call Frequency"] || "Unknown",
      }
    } catch (error) {
      return {
        status: "error",
      }
    }
  }
}

export const alphaVantageAPI = new AlphaVantageAPI()
