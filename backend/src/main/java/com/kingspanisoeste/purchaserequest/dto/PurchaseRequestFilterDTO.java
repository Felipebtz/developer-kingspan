
package com.kingspanisoeste.purchaserequest.dto;

import java.time.LocalDate;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;

public record PurchaseRequestFilterDTO(
    PurchaseRequestStatus status,
    PurchaseCategory category,
    Long costCenterId,
    LocalDate createdFrom,
    LocalDate createdTo
) {}
