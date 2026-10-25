package com.kingspanisoeste.purchaserequest.domain;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class PurchaseAmountCalculator {

    private static final int FINANCIAL_SCALE = 4;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.UNNECESSARY;

    public BigDecimal calculateSubtotal(Integer quantity, BigDecimal unitPrice) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero.");
        }
        if (unitPrice == null || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Preço unitário deve ser maior que zero.");
        }

        BigDecimal normalizedPrice = unitPrice.setScale(FINANCIAL_SCALE, ROUNDING_MODE);
        return normalizedPrice
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(FINANCIAL_SCALE, ROUNDING_MODE);
    }

    public BigDecimal calculateTotal(List<BigDecimal> subtotals) {
        if (subtotals == null || subtotals.isEmpty()) {
            return BigDecimal.ZERO.setScale(FINANCIAL_SCALE, ROUNDING_MODE);
        }

        return subtotals.stream()
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(FINANCIAL_SCALE, ROUNDING_MODE);
    }

    public void validateIntegrity(BigDecimal declaredTotal, List<BigDecimal> actualSubtotals) {
        BigDecimal calculatedTotal = calculateTotal(actualSubtotals);
        if (declaredTotal.compareTo(calculatedTotal) != 0) {
            throw new IllegalStateException(
                String.format("Inconsistência financeira: O total declarado (%s) diverge do total calculado (%s).", 
                declaredTotal, calculatedTotal)
            );
        }
    }
}