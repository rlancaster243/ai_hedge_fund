# AI Hedge Fund

This project is a Next.js application for AI-driven trading strategies, backtesting, and market analysis.

## Setup

To run this project locally, you will need to set up the following environment variables. You can create a `.env.local` file in the root of the `ai-hedge-fund` directory to store these variables.

### Required Environment Variables

*   **`DATABASE_URL`**: The connection string for your Neon PostgreSQL database.
    *   Example: `postgresql://user:password@host:port/dbname?sslmode=require`

*   **`ALPACA_API_KEY`**: Your API Key ID for Alpaca paper trading or live trading.
    *   Obtain from your Alpaca dashboard.

*   **`ALPACA_SECRET_KEY`**: Your Secret Key for Alpaca paper trading or live trading.
    *   Obtain from your Alpaca dashboard.

*   **`ALPACA_API_ENDPOINT`**: The API endpoint for Alpaca. For paper trading, this is typically `https://paper-api.alpaca.markets`. The application is currently hardcoded to use the paper trading URL, but setting this variable is good practice for future flexibility.
    *   Default used in code: `https://paper-api.alpaca.markets`

*   **`ALPHA_VANTAGE_API_KEY`**: Your API key for Alpha Vantage.
    *   Obtain from the Alpha Vantage website.
    *   If not provided, the application will use a demo key which has limitations.

### Example `.env.local` file:

```
DATABASE_URL="your_neon_database_url"
ALPACA_API_KEY="your_alpaca_api_key"
ALPACA_SECRET_KEY="your_alpaca_secret_key"
ALPACA_API_ENDPOINT="https://paper-api.alpaca.markets"
ALPHA_VANTAGE_API_KEY="your_alpha_vantage_api_key"
```

## Development

[Instructions for running the development server, building the project, etc., can be added here later.]
