package com.kingspanisoeste.purchaserequest.dto;

import jakarta.validation.constraints.NotNull;

public record ApprovalDecisionDTO(
    @NotNull(message = "lockVersion é obrigatório.")
    Long lockVersion,
    String comment
) {}
