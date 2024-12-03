package com.example.trading_stimulitaor.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockHistorical {
    private LocalDateTime timestamp;
    private Double price;
    private Double open;
    private Double high;
    private Double low;
    private Long volume;
}