package com.kingspanisoeste.budget.dto;

import java.math.BigDecimal;

public record MonthlyBudgetResponseDTO(
    Long id,
    Long costCenterId,
    String costCenterName,
    String competence,
    BigDecimal allocatedAmount,
    BigDecimal consumedAmount,
    BigDecimal availableAmount
) {}