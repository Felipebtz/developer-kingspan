package com.kingspanisoeste.budget.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;
import com.kingspanisoeste.budget.repository.MonthlyBudgetRepository;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock MonthlyBudgetRepository budgetRepository;

    private BudgetService service;
    private RequestVersionEntity version;

    @BeforeEach
    void setUp() {
        service = new BudgetService(budgetRepository);
        version = mock(RequestVersionEntity.class);
        when(version.getCostCenterId()).thenReturn(20L);
        when(version.getCompetenceDate()).thenReturn(LocalDate.of(2026, 10, 1));
    }

    @Test
    void deveConsumirQuandoSaldoForSuficiente() {
        MonthlyBudgetEntity budget = budget("1000.00");
        when(version.getTotalAmount()).thenReturn(new BigDecimal("800.0000"));
        when(budgetRepository.findForUpdate(20L, LocalDate.of(2026, 10, 1)))
            .thenReturn(Optional.of(budget));

        service.consumeForFinalApproval(version);

        assertEquals(0, budget.getConsumedAmount().compareTo(new BigDecimal("800.00")));
        verify(budgetRepository).findForUpdate(20L, LocalDate.of(2026, 10, 1));
    }

    @Test
    void devePermitirConsumoIgualAoSaldo() {
        MonthlyBudgetEntity budget = budget("1000.00");
        when(version.getTotalAmount()).thenReturn(new BigDecimal("1000.0000"));
        when(budgetRepository.findForUpdate(20L, LocalDate.of(2026, 10, 1)))
            .thenReturn(Optional.of(budget));

        service.consumeForFinalApproval(version);

        assertEquals(new BigDecimal("0.00"), budget.getAvailableAmount());
    }

    @Test
    void saldoInsuficienteNaoDeveConsumir() {
        MonthlyBudgetEntity budget = budget("1000.00");
        when(version.getTotalAmount()).thenReturn(new BigDecimal("1000.0100"));
        when(budgetRepository.findForUpdate(20L, LocalDate.of(2026, 10, 1)))
            .thenReturn(Optional.of(budget));

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.consumeForFinalApproval(version));

        assertEquals("BUDGET_EXCEEDED", exception.getCode());
        assertEquals(new BigDecimal("0.00"), budget.getConsumedAmount());
    }

    @Test
    void mesSemOrcamentoDeveSerTratadoComoSaldoZero() {
        when(budgetRepository.findForUpdate(20L, LocalDate.of(2026, 10, 1)))
            .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.consumeForFinalApproval(version));

        assertEquals("BUDGET_EXCEEDED", exception.getCode());
    }

    private MonthlyBudgetEntity budget(String allocated) {
        return new MonthlyBudgetEntity(
            new CostCenterEntity("CC", "Centro", null),
            YearMonth.of(2026, 10),
            new BigDecimal(allocated)
        );
    }
}
