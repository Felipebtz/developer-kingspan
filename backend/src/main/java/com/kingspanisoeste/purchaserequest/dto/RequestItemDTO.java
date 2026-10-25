package com.kingspanisoeste.purchaserequest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RequestItemDTO(


    Long id, // Nulo na criação, preenchido na resposta ou edição
    
    @NotBlank(message = "A descrição do item é obrigatória.")
    @Size(max = 255, message = "A descrição do item não pode ultrapassar 255 caracteres.")
    String description,
    
    @NotNull(message = "A quantidade é obrigatória.")
    @Positive(message = "A quantidade deve ser maior que zero.")
    Integer quantity,
    
    @NotNull(message = "O preço unitário é obrigatório.")
    @Positive(message = "O preço unitário deve ser maior que zero.")
    BigDecimal unitPrice,
    
    BigDecimal subtotal // Preenchido apenas pelo back
) {}
