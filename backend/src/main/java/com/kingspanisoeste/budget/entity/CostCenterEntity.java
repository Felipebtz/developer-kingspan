
package com.kingspanisoeste.budget.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

import com.kingspanisoeste.budget.entity.enums.CostCenterStatus;

@Entity
@Table(name = "cost_centers", schema = "public")
public class CostCenterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cost_center_id")
    private Long id;

    @Column(
        name = "cost_center_code",
        nullable = false,
        unique = true,
        length = 20
    )
    private String code;

    @Column(
        name = "cost_center_name",
        nullable = false,
        length = 100
    )
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CostCenterStatus status = CostCenterStatus.ACTIVE;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CostCenterEntity() {
        // Construtor exigido pelo JPA
    }

    public CostCenterEntity(
        String code,
        String name,
        String description
    ) {
        this.code = Objects.requireNonNull(code);
        this.name = Objects.requireNonNull(name);
        this.description = description;
        this.status = CostCenterStatus.ACTIVE;
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

    public void activate() {
        this.status = CostCenterStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = CostCenterStatus.INACTIVE;
    }

    public void updateDetails(
        String name,
        String description
    ) {
        this.name = Objects.requireNonNull(name);
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public CostCenterStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
