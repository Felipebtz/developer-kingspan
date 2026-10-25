
package com.kingspanisoeste.purchaserequest.entity;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "cost_center_id", nullable = false)
    private Long costCenterId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50)
    private PurchaseCategory category;

    @Column(name = "needed_by")
    private LocalDate neededBy;

    @Column(
        name = "total_amount",
        nullable = false,
        precision = 19,
        scale = 4
    )
    private BigDecimal totalAmount =
        new BigDecimal("0.0000");

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PurchaseRequestStatus status =
        PurchaseRequestStatus.DRAFT;

    @Column(name = "current_version", nullable = false)
    private Integer currentVersion = 0;

    @Version
    @Column(name = "lock_version", nullable = false)
    private Long lockVersion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @OneToMany(
        mappedBy = "purchaseRequest",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<RequestItemEntity> items = new ArrayList<>();


    protected PurchaseRequestEntity() {
        
    }

    public PurchaseRequestEntity(Long requesterId,Long costCenterId) {
        this.requesterId = Objects.requireNonNull(requesterId);
        this.costCenterId = Objects.requireNonNull(costCenterId, "Centro de custo é obrigatorio");
    }


    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }


    public boolean isEditable() {
        return status == PurchaseRequestStatus.DRAFT
            || status == PurchaseRequestStatus.CHANGES_REQUESTED;
    }


    public void updateDraft(Long costCenterId,String title, String description,PurchaseCategory category,LocalDate neededBy
    ) {
        if (!isEditable()) {
            throw new IllegalStateException(
                "A solicitação não pode ser editada neste estado."
            );
        }

        this.costCenterId = costCenterId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.neededBy = neededBy;

        touch();
    }


    public void updateTotal(BigDecimal total) {
        if (!isEditable()) {
            throw new IllegalStateException(
                "Não é permitido alterar o total."
            );
        }

        Objects.requireNonNull(total);

        if (total.signum() < 0) {
            throw new IllegalArgumentException(
                "O valor total não pode ser negativo."
            );
        }

        this.totalAmount = total.setScale(
            4,
            RoundingMode.HALF_UP
        );

        touch();
    }


    public void addItem(RequestItemEntity item) {
        if (!isEditable()) {
            throw new IllegalStateException(
                "Não é permitido adicionar itens."
            );
        }

        Objects.requireNonNull(item);

        items.add(item);
        item.setPurchaseRequest(this);

        touch();
    }


    public void removeItem(RequestItemEntity item) {
        if (!isEditable()) {
            throw new IllegalStateException(
                "Não é permitido remover itens."
            );
        }

        if (items.remove(item)) {
            item.setPurchaseRequest(null);
            touch();
        }
    }


    public void markSubmitted(int versionNumber,Instant submittedAt) 
    {
        if (!isEditable()) {
            throw new IllegalStateException(
                "Estado inválido para submissão."
            );
        }

        if (versionNumber != currentVersion + 1) {
            throw new IllegalArgumentException(
                "Número de versão inválido."
            );
        }

        this.status =
            PurchaseRequestStatus.PENDING_APPROVAL;

        this.currentVersion = versionNumber;

        this.submittedAt =
            Objects.requireNonNull(submittedAt);

        touch();
    }

    public void markApprovalProgress() {
        requireStatus(PurchaseRequestStatus.PENDING_APPROVAL);
        touch();
    }

    public void markApproved() {
        transitionFromPending(PurchaseRequestStatus.APPROVED);
    }

    public void markRejected() {
        transitionFromPending(PurchaseRequestStatus.REJECTED);
    }

    public void markChangesRequested() {
        transitionFromPending(PurchaseRequestStatus.CHANGES_REQUESTED);
    }

    public void markCancelled() {
        if (status != PurchaseRequestStatus.DRAFT
                && status != PurchaseRequestStatus.PENDING_APPROVAL
                && status != PurchaseRequestStatus.CHANGES_REQUESTED) {
            throw new IllegalStateException(
                "A solicitação não pode ser cancelada neste estado."
            );
        }

        status = PurchaseRequestStatus.CANCELLED;
        touch();
    }

    private void transitionFromPending(PurchaseRequestStatus target) {
        requireStatus(PurchaseRequestStatus.PENDING_APPROVAL);
        status = target;
        touch();
    }

    private void requireStatus(PurchaseRequestStatus expected) {
        if (status != expected) {
            throw new IllegalStateException(
                "Transição inválida para o estado " + status + "."
            );
        }
    }


    public void touch() {
        this.updatedAt = Instant.now();
    }


    // Getters

    public Long getId() {
        return id;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public Long getCostCenterId() {
        return costCenterId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public PurchaseCategory getCategory() {
        return category;
    }

    public LocalDate getNeededBy() {
        return neededBy;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public PurchaseRequestStatus getStatus() {
        return status;
    }

    public Integer getCurrentVersion() {
        return currentVersion;
    }

    public Long getLockVersion() {
        return lockVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public List<RequestItemEntity> getItems() {
        return List.copyOf(items);
    }
}
