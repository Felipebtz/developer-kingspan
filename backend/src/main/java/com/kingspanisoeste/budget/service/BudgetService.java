package com.kingspanisoeste.budget.service;

import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;
import com.kingspanisoeste.budget.repository.MonthlyBudgetRepository;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BudgetService {

    private final MonthlyBudgetRepository budgetRepository;

    public BudgetService(MonthlyBudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void consumeForFinalApproval(RequestVersionEntity version) {
        MonthlyBudgetEntity budget = budgetRepository.findForUpdate(
                version.getCostCenterId(),
                version.getCompetenceDate())
            .orElseThrow(() -> budgetExceeded());

        if (budget.getAvailableAmount().compareTo(version.getTotalAmount()) < 0) {
            throw budgetExceeded();
        }

        try {
            budget.consume(version.getTotalAmount());
        } catch (ArithmeticException | IllegalArgumentException e) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_BUDGET_AMOUNT",
                "O valor da solicitação não possui uma escala monetária válida."
            );
        } catch (IllegalStateException e) {
            throw budgetExceeded();
        }
    }

    private BusinessException budgetExceeded() {
        return new BusinessException(
            HttpStatus.UNPROCESSABLE_CONTENT,
            "BUDGET_EXCEEDED",
            "Saldo orçamentário insuficiente para aprovar a solicitação."
        );
    }
}
