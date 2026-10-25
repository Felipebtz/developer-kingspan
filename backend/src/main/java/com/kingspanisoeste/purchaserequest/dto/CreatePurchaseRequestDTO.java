package com.kingspanisoeste.purchaserequest.dto;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreatePurchaseRequestDTO(
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
