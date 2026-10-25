package com.kingspanisoeste.purchaserequest.dto;

import jakarta.validation.constraints.NotNull;

public record CancelPurchaseRequestDTO(
    @NotNull(message = "lockVersion é obrigatório.")
    Long lockVersion
) {}
