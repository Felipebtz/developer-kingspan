package com.kingspanisoeste.purchaserequest.dto;

import java.time.LocalDate;
import java.util.List;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePurchaseRequestDTO(

    @NotNull(message = "A versão de concorrência (lockVersion) é obrigatória para edição.")
    Long lockVersion,
    
    Long costCenterId,
    
    @Size(max = 255, message = "O título não pode ultrapassar 255 caracteres.")
    String title,
    
    String description,
    
    PurchaseCategory category,
    
    @Future(message = "A data de necessidade deve ser uma data futura.")
    LocalDate neededBy,
    
    @Valid 
    List<RequestItemDTO> items
) {
    
}
