package com.kingspanisoeste.purchaserequest.repository;

import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestAuditEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseRequestAuditRepository
        extends JpaRepository<PurchaseRequestAuditEntity, Long> {

    Optional<PurchaseRequestAuditEntity>
    findById(Long id);

    List<PurchaseRequestAuditEntity>
    findByPurchaseRequestId(
            Long purchaseRequestId);

    List<PurchaseRequestAuditEntity>
    findByPurchaseRequestIdOrderByCreatedAtDesc(
            Long purchaseRequestId);

    List<PurchaseRequestAuditEntity>
    findByUserId(
            Long userId);

    List<PurchaseRequestAuditEntity>
    findByAction(
            String action);

    List<PurchaseRequestAuditEntity>
    findByNewStatus(
            PurchaseRequestStatus status);

    List<PurchaseRequestAuditEntity>
    findByRequestIdTracing(
            String requestIdTracing);
}
