package com.kingspanisoeste.budget.dto;

import java.math.BigDecimal;

public record CreateMonthlyBudgetDTO(
    Long costCenterId,
    String competence,
    BigDecimal allocatedAmount
) {}