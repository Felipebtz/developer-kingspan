package com.kingspanisoeste.purchaserequest.entity;

import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "request_versions")
public class RequestVersionEntity {

    private static final ZoneId BUSINESS_ZONE =
            ZoneId.of("America/Sao_Paulo");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "purchase_request_id", nullable = false)
    private Long purchaseRequestId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "cost_center_id", nullable = false)
    private Long costCenterId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private PurchaseCategory category;

    @Column(name = "needed_by")
    private LocalDate neededBy;

    @Column(
        name = "total_amount",
        nullable = false,
        precision = 19,
        scale = 4
    )
    private BigDecimal totalAmount;

    @Column(name = "competence_date", nullable = false)
    private LocalDate competenceDate;

    @Column(name = "submitted_by", nullable = false)
    private Long submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @OneToMany(
        mappedBy = "requestVersion",
        cascade = CascadeType.PERSIST,
        fetch = FetchType.LAZY
    )
    private List<RequestVersionItemEntity> items =
            new ArrayList<>();

    protected RequestVersionEntity() {
        // JPA
    }

    public RequestVersionEntity(
            PurchaseRequestEntity request,
            Integer versionNumber,
            Long submittedBy,
            Instant submittedAt
    ) {
        Objects.requireNonNull(request);
        Objects.requireNonNull(submittedBy);
        Objects.requireNonNull(submittedAt);

        if (request.getId() == null) {
            throw new IllegalArgumentException(
                "A solicitação precisa estar persistida."
            );
        }

        if (versionNumber == null || versionNumber <= 0) {
            throw new IllegalArgumentException(
                "A versão deve ser maior que zero."
            );
        }

        if (request.getCostCenterId() == null ||
            request.getTitle() == null ||
            request.getTitle().isBlank() ||
            request.getDescription() == null ||
            request.getDescription().isBlank() ||
            request.getCategory() == null) {

            throw new IllegalArgumentException(
                "A solicitação está incompleta para submissão."
            );
        }

        if (request.getTotalAmount() == null ||
            request.getTotalAmount().signum() <= 0 ||
            request.getItems().isEmpty()) {

            throw new IllegalArgumentException(
                "A solicitação deve possuir itens e valor positivo."
            );
        }

        this.purchaseRequestId = request.getId();
        this.versionNumber = versionNumber;

        this.requesterId = request.getRequesterId();
        this.costCenterId = request.getCostCenterId();

        this.title = request.getTitle();
        this.description = request.getDescription();
        this.category = request.getCategory();
        this.neededBy = request.getNeededBy();

        this.totalAmount = request.getTotalAmount();

        this.submittedBy = submittedBy;
        this.submittedAt = submittedAt;

        this.competenceDate = submittedAt
                .atZone(BUSINESS_ZONE)
                .toLocalDate()
                .withDayOfMonth(1);

        for (RequestItemEntity item : request.getItems()) {
            RequestVersionItemEntity snapshotItem =
                    new RequestVersionItemEntity(
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getSubtotal()
                    );

            snapshotItem.setRequestVersion(this);
            this.items.add(snapshotItem);
        }
    }

    public Long getId() {
        return id;
    }

    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
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

    public LocalDate getCompetenceDate() {
        return competenceDate;
    }

    public Long getSubmittedBy() {
        return submittedBy;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public List<RequestVersionItemEntity> getItems() {
        return List.copyOf(items);
    }
}
