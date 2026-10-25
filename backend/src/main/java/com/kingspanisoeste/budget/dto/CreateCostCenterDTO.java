package com.kingspanisoeste.budget.dto;

public record CreateCostCenterDTO(
    String code,
    String name,
    String description
) {}