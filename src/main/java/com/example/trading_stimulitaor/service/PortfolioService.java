package com.example.trading_stimulitaor.service;

import com.example.trading_stimulitaor.model.Portfolio;
import com.example.trading_stimulitaor.model.Stock;
import com.example.trading_stimulitaor.model.User;
import com.example.trading_stimulitaor.repository.PortfolioRepository;
import com.example.trading_stimulitaor.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PortfolioService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private UserService userService;

    public List<Portfolio> getUserPortfolio(String username) {
        User user = userService.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        List<Portfolio> portfolios = portfolioRepository.findByUserUsername(username);

        portfolios.forEach(portfolio -> {
            Stock stock = stockRepository.findBySymbol(portfolio.getStockSymbol());
            if (stock != null) {
                // Fetch latest price from API
                stock = stockService.getStockData(portfolio.getStockSymbol());
                portfolio.setCurrentValue(stock.getCurrentPrice() * portfolio.getQuantity());
                portfolio.setProfitLoss(portfolio.getCurrentValue() - (portfolio.getAveragePrice() * portfolio.getQuantity()));
            }
        });

        return portfolios;
    }

    @Transactional
    public Portfolio updatePortfolio(String username, String symbol, Integer quantity, Double price, String tradeType) {
        User user = userService.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        Portfolio portfolio = portfolioRepository.findByUserUsernameAndStockSymbol(username, symbol);
        if (portfolio == null) {
            portfolio = new Portfolio();
            portfolio.setUser(user);
            portfolio.setStockSymbol(symbol);
            portfolio.setQuantity(0);
            portfolio.setAveragePrice(0.0);
            portfolio.setTotalInvestment(0.0);
        }

        int oldQuantity = portfolio.getQuantity();
        double oldTotalInvestment = oldQuantity * portfolio.getAveragePrice();

        if (tradeType.equalsIgnoreCase("BUY")) {
            int newQuantity = oldQuantity + quantity;
            double newTotalInvestment = oldTotalInvestment + (quantity * price);
            portfolio.setQuantity(newQuantity);
            portfolio.setAveragePrice(newTotalInvestment / newQuantity);
            portfolio.setTotalInvestment(newTotalInvestment);
        } else if (tradeType.equalsIgnoreCase("SELL")) {
            if (oldQuantity < quantity) {
                throw new RuntimeException("Insufficient shares to sell");
            }
            int newQuantity = oldQuantity - quantity;
            portfolio.setQuantity(newQuantity);
            portfolio.setTotalInvestment(newQuantity > 0 ? newQuantity * portfolio.getAveragePrice() : 0.0);
            portfolio.setAveragePrice(newQuantity > 0 ? portfolio.getAveragePrice() : 0.0);
        } else {
            throw new RuntimeException("Invalid trade type. Use 'BUY' or 'SELL'.");
        }

        Stock stock = stockService.getStockData(symbol);
        portfolio.setCurrentValue(portfolio.getQuantity() * stock.getCurrentPrice());
        portfolio.setProfitLoss(portfolio.getCurrentValue() - (portfolio.getAveragePrice() * portfolio.getQuantity()));

        return portfolioRepository.save(portfolio);
    }
}