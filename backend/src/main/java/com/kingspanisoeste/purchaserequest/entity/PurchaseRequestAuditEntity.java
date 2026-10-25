
package com.kingspanisoeste.purchaserequest.entity;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "purchase_request_audit")
public class PurchaseRequestAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "purchase_request_id", nullable = false)
    private Long purchaseRequestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_role", nullable = false, length = 50)
    private String userRole;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private PurchaseRequestStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 50)
    private PurchaseRequestStatus newStatus;

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "step_order")
    private Integer stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_level", length = 50)
    private ApprovalRequiredLevel requiredLevel;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "request_id_tracing", length = 255)
    private String requestIdTracing;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    protected PurchaseRequestAuditEntity() {
        // JPA
    }

    public PurchaseRequestAuditEntity(
        Long purchaseRequestId,
        Long userId,
        String userRole,
        String action,
        PurchaseRequestStatus previousStatus,
        PurchaseRequestStatus newStatus,
        Integer versionNumber,
        String requestIdTracing,
        String comments,
        Instant createdAt
    ) {
        this(
            purchaseRequestId,
            userId,
            userRole,
            action,
            previousStatus,
            newStatus,
            versionNumber,
            null,
            null,
            requestIdTracing,
            comments,
            createdAt
        );
    }

    public PurchaseRequestAuditEntity(
        Long purchaseRequestId,
        Long userId,
        String userRole,
        String action,
        PurchaseRequestStatus previousStatus,
        PurchaseRequestStatus newStatus,
        Integer versionNumber,
        Integer stepOrder,
        ApprovalRequiredLevel requiredLevel,
        String requestIdTracing,
        String comments,
        Instant createdAt
    ) {
        this.purchaseRequestId =
            Objects.requireNonNull(purchaseRequestId);

        this.userId = Objects.requireNonNull(userId);

        this.userRole = requiredText(
            userRole,
            "Papel do usuário",
            50
        );

        this.action = requiredText(
            action,
            "Ação",
            100
        );

        if (versionNumber != null && versionNumber < 0) {
            throw new IllegalArgumentException(
                "Número de versão inválido."
            );
        }

        if (stepOrder != null && stepOrder <= 0) {
            throw new IllegalArgumentException(
                "Ordem da etapa inválida."
            );
        }

        if (requestIdTracing != null
                && requestIdTracing.length() > 255) {
            throw new IllegalArgumentException(
                "X-Request-Id excede 255 caracteres."
            );
        }

        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.versionNumber = versionNumber;
        this.stepOrder = stepOrder;
        this.requiredLevel = requiredLevel;
        this.requestIdTracing = requestIdTracing;
        this.comments = comments;

        this.createdAt = Objects.requireNonNull(createdAt);
    }

    private static String requiredText(
        String value,
        String field,
        int maxLength
    ) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                field + " é obrigatório."
            );
        }

        String normalized = value.trim();

        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(
                field + " excede o tamanho permitido."
            );
        }

        return normalized;
    }

    public Long getId() {
        return id;
    }

    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserRole() {
        return userRole;
    }

    public String getAction() {
        return action;
    }

    public PurchaseRequestStatus getPreviousStatus() {
        return previousStatus;
    }

    public PurchaseRequestStatus getNewStatus() {
        return newStatus;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public ApprovalRequiredLevel getRequiredLevel() {
        return requiredLevel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getRequestIdTracing() {
        return requestIdTracing;
    }

    public String getComments() {
        return comments;
    }
}
