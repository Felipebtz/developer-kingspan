package com.kingspanisoeste.purchaserequest.dto;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PurchaseRequestResponseDTO(
    Long id,
    Long requesterId,
    Long costCenterId,
    String title,
    String description,
    PurchaseCategory category,
    LocalDate neededBy,
    BigDecimal totalAmount,
    PurchaseRequestStatus status,
    Integer currentVersion,
    Long lockVersion,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime submittedAt,
    List<RequestItemDTO> items,
    List<String> allowedActions 
) {}