package com.example.trading_stimulitaor.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String stockSymbol;
    private Integer quantity;
    private Double averagePrice;
    private Double totalInvestment;
    private Double currentValue;

    // Custom getter and setter for profitLoss
    @Setter
    @Getter
    @Transient // Indicates this field is not stored in the database
    private Double profitLoss;

    @Column(name = "last_updated")
    private java.time.LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = java.time.LocalDateTime.now();
        totalInvestment = quantity * averagePrice;
    }

}