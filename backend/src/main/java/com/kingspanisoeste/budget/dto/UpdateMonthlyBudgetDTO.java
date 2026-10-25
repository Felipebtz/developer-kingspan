package com.kingspanisoeste.budget.dto;

import java.math.BigDecimal;

public record UpdateMonthlyBudgetDTO(
    BigDecimal allocatedAmount
) {}