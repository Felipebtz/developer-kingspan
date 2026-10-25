package com.kingspanisoeste.purchaserequest.domain;

import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestItemEntity;
import com.kingspanisoeste.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
public class PurchaseRequestValidator {

    private final PurchaseAmountCalculator amountCalculator;

    public PurchaseRequestValidator(PurchaseAmountCalculator amountCalculator) {
        this.amountCalculator = amountCalculator;
    }

    public void validateForSubmission(PurchaseRequestEntity request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(HttpStatus.valueOf(422), "MISSING_TITLE", "O título é obrigatório para submissão.");
        }
        
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new BusinessException(HttpStatus.valueOf(422), "MISSING_DESCRIPTION", "A descrição é obrigatória para submissão.");
        }
        
        if (request.getCategory() == null) {
            throw new BusinessException(HttpStatus.valueOf(422), "MISSING_CATEGORY", "A categoria é obrigatória para submissão.");
        }
        
        if (request.getCostCenterId() == null) {
            throw new BusinessException(HttpStatus.valueOf(422), "MISSING_COST_CENTER", "O centro de custo autorizado é obrigatório para submissão.");
        }

        LocalDate today = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        if (request.getNeededBy() != null && !request.getNeededBy().isAfter(today)) {
            throw new BusinessException(HttpStatus.valueOf(422), "INVALID_NEEDED_BY", "A data de necessidade deve ser futura.");
        }

        List<RequestItemEntity> items = request.getItems();
        if (items == null || items.isEmpty()) {
            throw new BusinessException(HttpStatus.valueOf(422), "MISSING_ITEMS", "A solicitação deve conter pelo menos um item para ser submetida.");
        }

        List<java.math.BigDecimal> subtotals = items.stream()
                .map(RequestItemEntity::getSubtotal)
                .toList();
        
        try {
            amountCalculator.validateIntegrity(request.getTotalAmount(), subtotals);
        } catch (IllegalStateException e) {
            throw new BusinessException(HttpStatus.valueOf(422), "FINANCIAL_INCONSISTENCY", e.getMessage());
        }
    }
}