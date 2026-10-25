package com.kingspanisoeste.purchaserequest.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.kingspanisoeste.purchaserequest.entity.RequestItemEntity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

class PurchaseAmountCalculatorTest {

    private final PurchaseAmountCalculator calculator = new PurchaseAmountCalculator();

    @Test
    void deveCalcularSubtotalComPrecisaoDecimal() {
        BigDecimal subtotal = calculator.calculateSubtotal(3, new BigDecimal("49.90"));

        assertEquals(0, subtotal.compareTo(new BigDecimal("149.7000")));
        assertEquals(4, subtotal.scale());
    }

    @Test
    void deveSomarMultiplosItens() {
        BigDecimal total = calculator.calculateTotal(List.of(
            new BigDecimal("149.7000"),
            new BigDecimal("100.3000"),
            new BigDecimal("0.0100")
        ));

        assertEquals(0, total.compareTo(new BigDecimal("250.0100")));
    }

    @Test
    void deveRetornarZeroParaListaVazia() {
        BigDecimal total = calculator.calculateTotal(List.of());

        assertEquals(new BigDecimal("0.0000"), total);
    }

    @Test
    void naoDeveAceitarQuantidadeOuPrecoNaoPositivos() {
        assertThrows(IllegalArgumentException.class,
            () -> calculator.calculateSubtotal(0, new BigDecimal("10.00")));
        assertThrows(IllegalArgumentException.class,
            () -> calculator.calculateSubtotal(-1, new BigDecimal("10.00")));
        assertThrows(IllegalArgumentException.class,
            () -> calculator.calculateSubtotal(1, BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class,
            () -> calculator.calculateSubtotal(1, new BigDecimal("-0.01")));
    }

    @Test
    void entidadeDeItemTambemDeveRejeitarValoresInvalidos() {
        assertThrows(IllegalArgumentException.class,
            () -> new RequestItemEntity("Item", 0, new BigDecimal("1.00")));
        assertThrows(IllegalArgumentException.class,
            () -> new RequestItemEntity("Item", 1, new BigDecimal("-1.00")));
    }

    @Test
    void naoDeveArredondarValorComMaisDeQuatroCasas() {
        assertThrows(ArithmeticException.class,
            () -> calculator.calculateSubtotal(1, new BigDecimal("1.23456")));
    }
}
