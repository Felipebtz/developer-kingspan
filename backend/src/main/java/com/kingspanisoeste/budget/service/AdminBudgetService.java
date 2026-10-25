
package com.kingspanisoeste.budget.service;

import com.kingspanisoeste.budget.dto.*;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;
import com.kingspanisoeste.budget.entity.enums.CostCenterStatus;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.budget.repository.MonthlyBudgetRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class AdminBudgetService {

    private static final BigDecimal MAX_AMOUNT =
        new BigDecimal("9999999999999999.99");

    private final MonthlyBudgetRepository budgetRepository;
    private final CostCenterRepository costCenterRepository;

    public AdminBudgetService(
        MonthlyBudgetRepository budgetRepository,
        CostCenterRepository costCenterRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.costCenterRepository = costCenterRepository;
    }

    @Transactional(readOnly = true)
    public List<MonthlyBudgetResponseDTO> list() {
        return budgetRepository.findAllWithCostCenter()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public MonthlyBudgetResponseDTO create(
        CreateMonthlyBudgetDTO dto
    ) {
        if (dto == null || dto.costCenterId() == null) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "COST_CENTER_REQUIRED",
                "Centro de custo obrigatório."
            );
        }

        YearMonth competence = parseCompetence(dto.competence());

        BigDecimal amount = validateAmount(
            dto.allocatedAmount()
        );

        CostCenterEntity costCenter = costCenterRepository
            .findById(dto.costCenterId())
            .orElseThrow(() -> error(
                HttpStatus.NOT_FOUND,
                "COST_CENTER_NOT_FOUND",
                "Centro de custo não encontrado."
            ));

        if (costCenter.getStatus() != CostCenterStatus.ACTIVE) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "COST_CENTER_INACTIVE",
                "Não é possível cadastrar orçamento para centro de custo inativo."
            );
        }

        if (budgetRepository.findByCostCenterIdAndCompetence(
                costCenter.getId(),
                competence.atDay(1)
            ).isPresent()) {
            throw error(
                HttpStatus.CONFLICT,
                "BUDGET_ALREADY_EXISTS",
                "Já existe orçamento para este centro de custo e competência."
            );
        }

        MonthlyBudgetEntity budget = new MonthlyBudgetEntity(
            costCenter,
            competence,
            amount
        );

        try {
            return toResponse(
                budgetRepository.saveAndFlush(budget)
            );
        } catch (DataIntegrityViolationException ex) {
            // Proteção adicional contra cadastros concorrentes.
            throw error(
                HttpStatus.CONFLICT,
                "BUDGET_CONFLICT",
                "Não foi possível criar o orçamento. Verifique se já existe um cadastro para esta competência."
            );
        }
    }

    @Transactional
    public MonthlyBudgetResponseDTO update(
        Long id,
        UpdateMonthlyBudgetDTO dto
    ) {
        if (id == null || id <= 0) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_BUDGET_ID",
                "Identificador do orçamento inválido."
            );
        }

        BigDecimal amount = validateAmount(
            dto == null ? null : dto.allocatedAmount()
        );

        MonthlyBudgetEntity budget = budgetRepository
            .findByIdForUpdate(id)
            .orElseThrow(() -> error(
                HttpStatus.NOT_FOUND,
                "BUDGET_NOT_FOUND",
                "Orçamento não encontrado."
            ));

        if (amount.compareTo(budget.getConsumedAmount()) < 0) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "BUDGET_BELOW_CONSUMED",
                "O orçamento não pode ser menor que o valor já consumido."
            );
        }

        budget.changeAllocation(amount);

        return toResponse(budget);
    }

    private YearMonth parseCompetence(String value) {
        try {
            if (value == null) {
                throw new IllegalArgumentException();
            }

            return YearMonth.parse(value);
        } catch (
            DateTimeParseException | IllegalArgumentException ex
        ) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_COMPETENCE",
                "Informe a competência no formato AAAA-MM."
            );
        }
    }

    private BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "BUDGET_AMOUNT_REQUIRED",
                "O valor do orçamento é obrigatório."
            );
        }

        try {
            BigDecimal normalized = amount.setScale(
                2,
                RoundingMode.UNNECESSARY
            );

            if (
                normalized.signum() < 0 ||
                normalized.compareTo(MAX_AMOUNT) > 0
            ) {
                throw new IllegalArgumentException();
            }

            return normalized;
        } catch (
            ArithmeticException | IllegalArgumentException ex
        ) {
            throw error(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_BUDGET_AMOUNT",
                "Informe um orçamento não negativo, com no máximo duas casas decimais e dentro do limite permitido."
            );
        }
    }

    private MonthlyBudgetResponseDTO toResponse(
        MonthlyBudgetEntity budget
    ) {
        return new MonthlyBudgetResponseDTO(
            budget.getId(),
            budget.getCostCenter().getId(),
            budget.getCostCenter().getName(),
            YearMonth.from(budget.getCompetence()).toString(),
            budget.getAllocatedAmount(),
            budget.getConsumedAmount(),
            budget.getAvailableAmount()
        );
    }

    private BusinessException error(
        HttpStatus status,
        String code,
        String message
    ) {
        return new BusinessException(status, code, message);
    }
}
