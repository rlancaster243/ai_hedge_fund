export const backtestTemplates = {
  smaStrategy: {
    name: "Simple Moving Average Strategy",
    description: "Buy when short MA crosses above long MA, sell when it crosses below",
    code: `import backtrader as bt
import yfinance as yf
from datetime import datetime

class SMAStrategy(bt.Strategy):
    params = (
        ('short_period', 20),
        ('long_period', 50),
    )

    def __init__(self):
        # Calculate moving averages
        self.short_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.short_period
        )
        self.long_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.long_period
        )
        
        # Create crossover signal
        self.crossover = bt.indicators.CrossOver(self.short_ma, self.long_ma)

    def next(self):
        if not self.position:  # Not in market
            if self.crossover > 0:  # Short MA crosses above Long MA
                self.buy(size=100)
        else:  # In market
            if self.crossover < 0:  # Short MA crosses below Long MA
                self.sell(size=self.position.size)

def run_backtest():
    cerebro = bt.Cerebro()
    cerebro.addstrategy(SMAStrategy)
    
    # Add data
    data = bt.feeds.YahooFinanceData(
        dataname='AAPL',
        fromdate=datetime(2023, 1, 1),
        todate=datetime(2024, 1, 1)
    )
    cerebro.adddata(data)
    
    # Set initial capital
    cerebro.broker.setcash(100000.0)
    
    # Add analyzers
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
    
    # Run backtest
    results = cerebro.run()
    return results[0]`,
  },

  rsiStrategy: {
    name: "RSI Mean Reversion Strategy",
    description: "Buy when RSI is oversold (< 30), sell when overbought (> 70)",
    code: `import backtrader as bt
import yfinance as yf
from datetime import datetime

class RSIStrategy(bt.Strategy):
    params = (
        ('rsi_period', 14),
        ('rsi_upper', 70),
        ('rsi_lower', 30),
    )

    def __init__(self):
        # Calculate RSI
        self.rsi = bt.indicators.RelativeStrengthIndex(
            self.data.close, period=self.params.rsi_period
        )

    def next(self):
        if not self.position:  # Not in market
            if self.rsi < self.params.rsi_lower:  # Oversold
                self.buy(size=100)
        else:  # In market
            if self.rsi > self.params.rsi_upper:  # Overbought
                self.sell(size=self.position.size)

def run_backtest():
    cerebro = bt.Cerebro()
    cerebro.addstrategy(RSIStrategy)
    
    # Add data
    data = bt.feeds.YahooFinanceData(
        dataname='AAPL',
        fromdate=datetime(2023, 1, 1),
        todate=datetime(2024, 1, 1)
    )
    cerebro.adddata(data)
    
    # Set initial capital
    cerebro.broker.setcash(100000.0)
    
    # Add analyzers
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
    
    # Run backtest
    results = cerebro.run()
    return results[0]`,
  },

  bollinger: {
    name: "Bollinger Bands Strategy",
    description: "Buy when price touches lower band, sell when it touches upper band",
    code: `import backtrader as bt
import yfinance as yf
from datetime import datetime

class BollingerStrategy(bt.Strategy):
    params = (
        ('period', 20),
        ('devfactor', 2.0),
    )

    def __init__(self):
        # Calculate Bollinger Bands
        self.bollinger = bt.indicators.BollingerBands(
            self.data.close, 
            period=self.params.period,
            devfactor=self.params.devfactor
        )

    def next(self):
        if not self.position:  # Not in market
            if self.data.close < self.bollinger.lines.bot:  # Price below lower band
                self.buy(size=100)
        else:  # In market
            if self.data.close > self.bollinger.lines.top:  # Price above upper band
                self.sell(size=self.position.size)

def run_backtest():
    cerebro = bt.Cerebro()
    cerebro.addstrategy(BollingerStrategy)
    
    # Add data
    data = bt.feeds.YahooFinanceData(
        dataname='AAPL',
        fromdate=datetime(2023, 1, 1),
        todate=datetime(2024, 1, 1)
    )
    cerebro.adddata(data)
    
    # Set initial capital
    cerebro.broker.setcash(100000.0)
    
    # Add analyzers
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
    
    # Run backtest
    results = cerebro.run()
    return results[0]`,
  },

  macdStrategy: {
    name: "MACD Strategy",
    description: "Buy on MACD bullish crossover, sell on bearish crossover",
    code: `import backtrader as bt
import yfinance as yf
from datetime import datetime

class MACDStrategy(bt.Strategy):
    params = (
        ('fast_period', 12),
        ('slow_period', 26),
        ('signal_period', 9),
    )

    def __init__(self):
        # Calculate MACD
        self.macd = bt.indicators.MACD(
            self.data.close,
            period_me1=self.params.fast_period,
            period_me2=self.params.slow_period,
            period_signal=self.params.signal_period
        )
        
        # Create crossover signal
        self.crossover = bt.indicators.CrossOver(
            self.macd.macd, self.macd.signal
        )

    def next(self):
        if not self.position:  # Not in market
            if self.crossover > 0:  # MACD crosses above signal
                self.buy(size=100)
        else:  # In market
            if self.crossover < 0:  # MACD crosses below signal
                self.sell(size=self.position.size)

def run_backtest():
    cerebro = bt.Cerebro()
    cerebro.addstrategy(MACDStrategy)
    
    # Add data
    data = bt.feeds.YahooFinanceData(
        dataname='AAPL',
        fromdate=datetime(2023, 1, 1),
        todate=datetime(2024, 1, 1)
    )
    cerebro.adddata(data)
    
    # Set initial capital
    cerebro.broker.setcash(100000.0)
    
    # Add analyzers
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
    
    # Run backtest
    results = cerebro.run()
    return results[0]`,
  },
}
