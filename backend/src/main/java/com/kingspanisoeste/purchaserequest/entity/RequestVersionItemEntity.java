
package com.kingspanisoeste.purchaserequest.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

@Entity
@Table(name = "request_version_items")
public class RequestVersionItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_version_id", nullable = false)
    private RequestVersionEntity requestVersion;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(
        name = "unit_price",
        nullable = false,
        precision = 19,
        scale = 4
    )
    private BigDecimal unitPrice;

    @Column(
        name = "subtotal",
        nullable = false,
        precision = 19,
        scale = 4
    )
    private BigDecimal subtotal;

    protected RequestVersionItemEntity() {
        // JPA
    }

    public RequestVersionItemEntity(
        String description,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {
        if (description == null || description.isBlank()
                || description.trim().length() > 255) {
            throw new IllegalArgumentException(
                "Descrição do item inválida."
            );
        }

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException(
                "Quantidade deve ser maior que zero."
            );
        }

        Objects.requireNonNull(unitPrice);
        Objects.requireNonNull(subtotal);

        BigDecimal price = unitPrice.setScale(
            4, RoundingMode.UNNECESSARY
        );

        BigDecimal amount = subtotal.setScale(
            4, RoundingMode.UNNECESSARY
        );

        if (price.signum() <= 0) {
            throw new IllegalArgumentException(
                "Preço unitário deve ser positivo."
            );
        }

        BigDecimal expected = price.multiply(
            BigDecimal.valueOf(quantity)
        );

        if (amount.compareTo(expected) != 0) {
            throw new IllegalArgumentException(
                "Subtotal inconsistente."
            );
        }

        if (amount.precision() - amount.scale() > 15) {
            throw new IllegalArgumentException(
                "Subtotal excede o limite permitido."
            );
        }

        this.description = description.trim();
        this.quantity = quantity;
        this.unitPrice = price;
        this.subtotal = amount;
    }

    // Uso interno pelo agregado RequestVersionEntity.
    void setRequestVersion(RequestVersionEntity version) {
        if (this.requestVersion != null
                && this.requestVersion != version) {
            throw new IllegalStateException(
                "O item já pertence a outra versão."
            );
        }

        this.requestVersion = Objects.requireNonNull(version);
    }

    public Long getId() {
        return id;
    }

    public RequestVersionEntity getRequestVersion() {
        return requestVersion;
    }

    public String getDescription() {
        return description;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }
}
