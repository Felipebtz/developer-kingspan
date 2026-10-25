
package com.kingspanisoeste.purchaserequest.entity;

import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "approval_steps")
public class ApprovalStepEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_version_id", nullable = false)
    private Long requestVersionId;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_level", nullable = false, length = 50)
    private ApprovalRequiredLevel requiredLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ApprovalStepStatus status = ApprovalStepStatus.WAITING;

    @Column(name = "approver_id")
    private Long approverId;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected ApprovalStepEntity() {
        // JPA
    }

    public ApprovalStepEntity(
        Long requestVersionId,
        Integer stepOrder,
        ApprovalRequiredLevel requiredLevel,
        boolean firstStep
    ) {
        this.requestVersionId =
            Objects.requireNonNull(requestVersionId);

        if (stepOrder == null || stepOrder <= 0) {
            throw new IllegalArgumentException(
                "Ordem da etapa inválida."
            );
        }

        if (firstStep && stepOrder != 1) {
            throw new IllegalArgumentException(
                "A primeira etapa deve possuir ordem 1."
            );
        }

        this.stepOrder = stepOrder;
        this.requiredLevel =
            Objects.requireNonNull(requiredLevel);

        this.status = firstStep
            ? ApprovalStepStatus.PENDING
            : ApprovalStepStatus.WAITING;
    }

    public void activate() {
        if (status != ApprovalStepStatus.WAITING) {
            throw new IllegalStateException(
                "Somente uma etapa em espera pode ser ativada."
            );
        }

        status = ApprovalStepStatus.PENDING;
    }

    public void approve(Long approverId, Instant decidedAt) {
        decide(
            ApprovalStepStatus.APPROVED,
            approverId,
            decidedAt
        );
    }

    public void reject(Long approverId, Instant decidedAt) {
        decide(
            ApprovalStepStatus.REJECTED,
            approverId,
            decidedAt
        );
    }

    public void requestChanges(
        Long approverId,
        Instant decidedAt
    ) {
        decide(
            ApprovalStepStatus.CHANGES_REQUESTED,
            approverId,
            decidedAt
        );
    }

    private void decide(
        ApprovalStepStatus newStatus,
        Long approverId,
        Instant decidedAt
    ) {
        if (status != ApprovalStepStatus.PENDING) {
            throw new IllegalStateException(
                "A etapa não está disponível para decisão."
            );
        }

        this.approverId =
            Objects.requireNonNull(approverId);

        this.decidedAt =
            Objects.requireNonNull(decidedAt);

        this.status = newStatus;
    }

    public void cancel() {
        if (status != ApprovalStepStatus.WAITING
                && status != ApprovalStepStatus.PENDING) {
            throw new IllegalStateException(
                "Esta etapa não pode ser cancelada."
            );
        }

        this.status = ApprovalStepStatus.CANCELLED;
    }

    public boolean isPending() {
        return status == ApprovalStepStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public Long getRequestVersionId() {
        return requestVersionId;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public ApprovalRequiredLevel getRequiredLevel() {
        return requiredLevel;
    }

    public ApprovalStepStatus getStatus() {
        return status;
    }

    public Long getApproverId() {
        return approverId;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }
}
