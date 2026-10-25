
package com.kingspanisoeste.budget.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Objects;

@Entity
@Table(
    name = "monthly_budgets",
    schema = "public",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_monthly_budget_competence",
            columnNames = {"cost_center_id", "competence"}
        )
    }
)
public class MonthlyBudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "budget_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "cost_center_id",
        referencedColumnName = "cost_center_id",
        nullable = false
    )
    private CostCenterEntity costCenter;

    @Column(name = "competence", nullable = false)
    private LocalDate competence;

    @Column(
        name = "allocated_amount",
        nullable = false,
        precision = 18,
        scale = 2
    )
    private BigDecimal allocatedAmount;

    @Column(
        name = "consumed_amount",
        nullable = false,
        precision = 18,
        scale = 2
    )
    private BigDecimal consumedAmount =
        new BigDecimal("0.00");

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MonthlyBudgetEntity() {
        // Construtor exigido pelo JPA
    }

    public MonthlyBudgetEntity(
        CostCenterEntity costCenter,
        YearMonth competence,
        BigDecimal allocatedAmount
    ) {
        this.costCenter = Objects.requireNonNull(
            costCenter, "Centro de custo obrigatório"
        );

        this.competence = Objects.requireNonNull(
            competence, "Competência obrigatória"
        ).atDay(1);

        this.allocatedAmount = validateAmount(allocatedAmount);
        this.consumedAmount = new BigDecimal("0.00");
    }

    private static BigDecimal validateAmount(BigDecimal amount) {
        Objects.requireNonNull(
            amount, "Valor do orçamento obrigatório"
        );

        BigDecimal normalized = amount.setScale(
            2, RoundingMode.UNNECESSARY
        );

        if (normalized.signum() < 0) {
            throw new IllegalArgumentException(
                "O orçamento não pode ser negativo"
            );
        }

        return normalized;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void changeAllocation(BigDecimal newAmount) {
        BigDecimal validated = validateAmount(newAmount);

        if (validated.compareTo(this.consumedAmount) < 0) {
            throw new IllegalArgumentException(
                "O orçamento não pode ser menor que o valor consumido"
            );
        }

        this.allocatedAmount = validated;
    }

    public BigDecimal getAvailableAmount() {
        return allocatedAmount.subtract(consumedAmount);
    }

    public void consume(BigDecimal amount) {
        Objects.requireNonNull(amount, "Valor de consumo obrigatório");

        BigDecimal normalized = amount.setScale(
            2, RoundingMode.UNNECESSARY
        );

        if (normalized.signum() <= 0) {
            throw new IllegalArgumentException(
                "O valor consumido deve ser positivo"
            );
        }

        if (getAvailableAmount().compareTo(normalized) < 0) {
            throw new IllegalStateException(
                "Saldo orçamentário insuficiente"
            );
        }

        consumedAmount = consumedAmount.add(normalized);
    }

    public Long getId() {
        return id;
    }

    public CostCenterEntity getCostCenter() {
        return costCenter;
    }

    public LocalDate getCompetence() {
        return competence;
    }

    public BigDecimal getAllocatedAmount() {
        return allocatedAmount;
    }

    public BigDecimal getConsumedAmount() {
        return consumedAmount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
