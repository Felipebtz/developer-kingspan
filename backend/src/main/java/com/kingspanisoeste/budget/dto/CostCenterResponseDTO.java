package com.kingspanisoeste.budget.dto;

public record CostCenterResponseDTO(
    Long id,
    String code,
    String name,
    String description,
    String status
) {}