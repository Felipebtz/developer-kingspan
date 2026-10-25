package com.kingspanisoeste.purchaserequest.dto;

import jakarta.validation.constraints.NotNull;

public record SubmitPurchaseRequestDTO(
    @NotNull(message = "A versão de concorrência (lockVersion) é obrigatória para a submissão.")
    Long lockVersion
) {
    
}
