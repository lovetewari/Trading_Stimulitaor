package com.example.trading_stimulitaor.service;

import com.example.trading_stimulitaor.model.Stock;
import com.example.trading_stimulitaor.model.StockHistorical;
import com.example.trading_stimulitaor.repository.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional
public class StockService {

    private static final Logger logger = LoggerFactory.getLogger(StockService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StockRepository stockRepository;

    @Value("${alphavantage.api.key}")
    private String alphaVantageApiKey;

    @Value("${alphavantage.api.baseurl}")
    private String alphaVantageBaseUrl;

    @Value("${yahoofinance.api.key}")
    private String yahooFinanceApiKey;

    @Value("${yahoofinance.api.baseurl}")
    private String yahooFinanceBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private final Map<String, String> symbolMap = createSymbolMap();

    private Map<String, String> createSymbolMap() {
        Map<String, String> map = new HashMap<>();
        // US Stocks
        map.put("GOOGL", "GOOGL");
        map.put("AAPL", "AAPL");
        map.put("MSFT", "MSFT");
        map.put("AMZN", "AMZN");
        map.put("META", "META");
        map.put("TSLA", "TSLA");

        // Indian Stocks
        map.put("RELIANCE", "RELIANCE.BSE");
        map.put("TCS", "TCS.BSE");
        map.put("INFY", "INFY.BSE");
        map.put("HDFC", "HDFC.BSE");
        map.put("WIPRO", "WIPRO.BSE");
        map.put("ITC", "ITC.BSE");
        map.put("SBIN", "SBIN.BSE");
        map.put("TATAMOTORS", "TATAMOTORS.BSE");
        map.put("HCLTECH", "HCLTECH.BSE");

        return Collections.unmodifiableMap(map);
    }

    private String formatStockSymbol(String symbol) {
        return symbolMap.getOrDefault(symbol.toUpperCase(), symbol);
    }

    public Stock getStockData(String symbol) {
        try {
            String formattedSymbol = formatStockSymbol(symbol);
            String url = String.format("%s?function=GLOBAL_QUOTE&symbol=%s&apikey=%s",
                    alphaVantageBaseUrl, formattedSymbol, alphaVantageApiKey);
            logger.info("Calling Alpha Vantage API for symbol: {}", formattedSymbol);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            Map<String, Object> responseMap = objectMapper.readValue(response.getBody(), Map.class);

            if (responseMap == null || !responseMap.containsKey("Global Quote") ||
                    ((Map)responseMap.get("Global Quote")).isEmpty()) {
                try {
                    return getYahooFinanceStockData(formattedSymbol);
                } catch (Exception yahooEx) {
                    logger.error("Yahoo Finance API also failed: {}", yahooEx.getMessage());
                    Stock cachedStock = stockRepository.findBySymbol(symbol);
                    if (cachedStock != null) {
                        logger.info("Returning cached data for symbol: {}", symbol);
                        return cachedStock;
                    }
                    throw new RuntimeException("No stock data available for symbol: " + symbol);
                }
            }

            Map<String, String> quote = (Map<String, String>) responseMap.get("Global Quote");
            Stock stock = stockRepository.findBySymbol(symbol);
            if (stock == null) {
                stock = new Stock();
                stock.setSymbol(symbol);
            }

            updateStockData(stock, quote);
            stock.setLastUpdated(LocalDateTime.now());

            return stockRepository.save(stock);

        } catch (Exception e) {
            logger.error("Error fetching stock data: {}", e.getMessage());
            throw new RuntimeException("Unable to fetch stock data. Please try again later.");
        }
    }

    private Stock getYahooFinanceStockData(String symbol) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", yahooFinanceApiKey);
            headers.set("X-RapidAPI-Host", "apidojo-yahoo-finance-v1.p.rapidapi.com");

            String url = String.format("%s/stock/v3/get-chart?symbol=%s&interval=1m&range=1d",
                    yahooFinanceBaseUrl, symbol);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response.getBody(), Map.class);
            Map<String, Object> meta = (Map<String, Object>) responseMap.get("meta");
            List<Map<String, Object>> quotes = (List<Map<String, Object>>)
                    ((Map<String, Object>) responseMap.get("chart")).get("result");

            if (quotes == null || quotes.isEmpty()) {
                throw new RuntimeException("No data available from Yahoo Finance");
            }

            Stock stock = stockRepository.findBySymbol(symbol);
            if (stock == null) {
                stock = new Stock();
                stock.setSymbol(symbol);
            }

            Map<String, Object> quote = quotes.get(0);
            stock.setCurrentPrice(((Number) meta.get("regularMarketPrice")).doubleValue());
            stock.setOpenPrice(((Number) meta.get("regularMarketOpen")).doubleValue());
            stock.setHighPrice(((Number) meta.get("regularMarketDayHigh")).doubleValue());
            stock.setLowPrice(((Number) meta.get("regularMarketDayLow")).doubleValue());
            stock.setVolume(((Number) meta.get("regularMarketVolume")).longValue());
            stock.setLastUpdated(LocalDateTime.now());

            return stockRepository.save(stock);
        } catch (Exception e) {
            logger.error("Error fetching Yahoo Finance data: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch Yahoo Finance data");
        }
    }

    public Stock getStock(String symbol) {
        return stockRepository.findBySymbol(symbol);
    }

    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    public List<StockHistorical> getHistoricalData(String symbol, String timeframe) {
        try {
            return getAlphaVantageHistoricalData(symbol, timeframe);
        } catch (Exception e) {
            logger.warn("Alpha Vantage API failed, trying Yahoo Finance: {}", e.getMessage());
            try {
                return getYahooFinanceHistoricalData(symbol, timeframe);
            } catch (Exception yahooEx) {
                logger.error("Yahoo Finance API also failed: {}", yahooEx.getMessage());
                throw new RuntimeException("Failed to fetch historical data from both APIs");
            }
        }
    }

    private List<StockHistorical> getAlphaVantageHistoricalData(String symbol, String timeframe) {
        try {
            String function;
            String outputsize = "compact";

            switch (timeframe) {
                case "1D":
                    function = "TIME_SERIES_INTRADAY";
                    break;
                case "1W":
                case "1M":
                    function = "TIME_SERIES_DAILY";
                    break;
                case "1Y":
                case "5Y":
                case "ALL":
                    function = "TIME_SERIES_WEEKLY";
                    break;
                default:
                    throw new RuntimeException("Invalid timeframe");
            }

            String formattedSymbol = formatStockSymbol(symbol);
            String interval = timeframe.equals("1D") ? "&interval=5min" : "";
            String url = String.format("%s?function=%s&symbol=%s%s&outputsize=%s&apikey=%s",
                    alphaVantageBaseUrl, function, formattedSymbol, interval, outputsize, alphaVantageApiKey);

            logger.info("Calling Alpha Vantage API with URL: {}", url.replace(alphaVantageApiKey, "API_KEY"));

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String responseBody = response.getBody();

            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);

            if (responseMap.containsKey("Information")) {
                String info = (String) responseMap.get("Information");
                logger.error("API Information Message: {}", info);
                throw new RuntimeException("Alpha Vantage API Limit: " + info);
            }

            if (responseMap.containsKey("Error Message")) {
                throw new RuntimeException("Alpha Vantage API Error: " + responseMap.get("Error Message"));
            }

            if (responseMap.containsKey("Note")) {
                String note = (String) responseMap.get("Note");
                logger.warn("Alpha Vantage API Note: {}", note);
                throw new RuntimeException("API Limit Reached: " + note);
            }

            String timeSeriesKey = getTimeSeriesKey(function);
            Map<String, Map<String, String>> timeSeries =
                    (Map<String, Map<String, String>>) responseMap.get(timeSeriesKey);

            if (timeSeries == null || timeSeries.isEmpty()) {
                logger.error("Available keys in response: {}", responseMap.keySet());
                throw new RuntimeException("No historical data available for " + symbol);
            }

            List<StockHistorical> historicalData = new ArrayList<>();
            int dataPoints = getDataPointsForTimeframe(timeframe);

            timeSeries.entrySet().stream()
                    .sorted(Map.Entry.<String, Map<String, String>>comparingByKey().reversed())
                    .limit(dataPoints)
                    .forEach(entry -> {
                        try {
                            Map<String, String> dataPoint = entry.getValue();
                            StockHistorical historical = new StockHistorical();
                            historical.setTimestamp(parseDateTime(entry.getKey()));
                            historical.setPrice(parseDouble(dataPoint.get("4. close")));
                            historical.setOpen(parseDouble(dataPoint.get("1. open")));
                            historical.setHigh(parseDouble(dataPoint.get("2. high")));
                            historical.setLow(parseDouble(dataPoint.get("3. low")));
                            historical.setVolume(parseLong(dataPoint.get("5. volume")));
                            historicalData.add(historical);
                        } catch (Exception e) {
                            logger.error("Error processing data point {}: {}", entry.getKey(), e.getMessage());
                        }
                    });

            if (historicalData.isEmpty()) {
                throw new RuntimeException("No historical data points were processed");
            }

            return historicalData;

        } catch (Exception e) {
            logger.error("Error in getAlphaVantageHistoricalData: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch Alpha Vantage historical data: " + e.getMessage());
        }
    }

    private List<StockHistorical> getYahooFinanceHistoricalData(String symbol, String timeframe) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", yahooFinanceApiKey);
            headers.set("X-RapidAPI-Host", "apidojo-yahoo-finance-v1.p.rapidapi.com");

            String range = getYahooTimeRange(timeframe);
            String interval = getYahooInterval(timeframe);

            String url = String.format("%s/stock/v3/get-historical-data?symbol=%s&range=%s&interval=%s",
                    yahooFinanceBaseUrl, symbol, range, interval);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            Map<String, Object> responseMap = objectMapper.readValue(response.getBody(), Map.class);
            List<Map<String, Object>> prices = (List<Map<String, Object>>) responseMap.get("prices");

            if (prices == null || prices.isEmpty()) {
                throw new RuntimeException("No historical data available from Yahoo Finance");
            }

            List<StockHistorical> historicalData = new ArrayList<>();
            int dataPoints = getDataPointsForTimeframe(timeframe);

            prices.stream()
                    .limit(dataPoints)
                    .forEach(price -> {
                        try {
                            if (price.get("date") == null || price.get("close") == null) {
                                logger.warn("Skipping incomplete data point: {}", price);
                                return;
                            }

                            StockHistorical historical = new StockHistorical();
                            historical.setTimestamp(LocalDateTime.ofEpochSecond(
                                    ((Number) price.get("date")).longValue(), 0, java.time.ZoneOffset.UTC));

                            historical.setPrice(getNumberValue(price.get("close"), 0.0));
                            historical.setOpen(getNumberValue(price.get("open"), historical.getPrice()));
                            historical.setHigh(getNumberValue(price.get("high"), historical.getPrice()));
                            historical.setLow(getNumberValue(price.get("low"), historical.getPrice()));
                            historical.setVolume(Double.valueOf(getNumberValue(price.get("volume"), 0.0)).longValue());

                            historicalData.add(historical);
                        } catch (Exception e) {
                            logger.error("Error processing Yahoo Finance data point: {}. Error: {}", price, e.getMessage());
                        }
                    });

            if (historicalData.isEmpty()) {
                throw new RuntimeException("No valid historical data points were processed from Yahoo Finance");
            }

            return historicalData;

        } catch (Exception e) {
            logger.error("Error fetching Yahoo Finance historical data: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch Yahoo Finance data: " + e.getMessage());
        }
    }

    private void updateStockData(Stock stock, Map<String, String> quote) {
        try {
            stock.setCurrentPrice(parseDouble(quote.get("05. price")));
            stock.setOpenPrice(parseDouble(quote.get("02. open")));
            stock.setHighPrice(parseDouble(quote.get("03. high")));
            stock.setLowPrice(parseDouble(quote.get("04. low")));
            stock.setVolume(parseLong(quote.get("06. volume")));
        } catch (Exception e) {
            logger.error("Error updating stock data: {}", e.getMessage());
            throw new RuntimeException("Error processing stock data");
        }
    }

    private Double parseDouble(String value) {
        try {
            return value != null ? Double.parseDouble(value.replace("$", "").trim()) : 0.0;
        } catch (NumberFormatException e) {
            logger.warn("Error parsing double value: {}", value);
            return 0.0;
        }
    }

    private Double getNumberValue(Object value, Double defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private Long parseLong(String value) {
        try {
            return value != null ? Long.parseLong(value.replace(",", "").trim()) : 0L;
        } catch (NumberFormatException e) {
            logger.warn("Error parsing long value: {}", value);
            return 0L;
        }
    }

    private String getTimeSeriesKey(String function) {
        switch (function) {
            case "TIME_SERIES_INTRADAY":
                return "Time Series (5min)";
            case "TIME_SERIES_DAILY":
                return "Time Series (Daily)";
            case "TIME_SERIES_WEEKLY":
                return "Weekly Time Series";
            default:
                throw new RuntimeException("Invalid function");
        }
    }

    private int getDataPointsForTimeframe(String timeframe) {
        switch (timeframe) {
            case "1D":
                return 78;  // 6.5 hours * 12 (5-min intervals)
            case "1W":
                return 5;   // 5 trading days
            case "1M":
                return 22;  // ~22 trading days
            case "1Y":
                return 52;  // 52 weeks
            case "5Y":
                return 260; // 52 weeks * 5
            case "ALL":
                return 520; // Max data points
            default:
                throw new RuntimeException("Invalid timeframe");
        }
    }

    private LocalDateTime parseDateTime(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dateStr + " 00:00:00",
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            } catch (Exception ex) {
                throw new RuntimeException("Error parsing date: " + dateStr);
            }
        }
    }

    private String getYahooTimeRange(String timeframe) {
        switch (timeframe) {
            case "1D":
                return "1d";
            case "1W":
                return "5d";
            case "1M":
                return "1mo";
            case "1Y":
                return "1y";
            case "5Y":
                return "5y";
            case "ALL":
                return "max";
            default:
                throw new RuntimeException("Invalid timeframe");
        }
    }

    private String getYahooInterval(String timeframe) {
        switch (timeframe) {
            case "1D":
                return "5m";
            case "1W":
                return "15m";
            case "1M":
                return "1d";
            case "1Y":
                return "1d";
            case "5Y":
                return "1wk";
            case "ALL":
                return "1mo";
            default:
                throw new RuntimeException("Invalid timeframe");
        }
    }
}