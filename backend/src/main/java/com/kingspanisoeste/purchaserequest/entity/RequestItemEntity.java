
package com.kingspanisoeste.purchaserequest.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

@Entity
@Table(name = "request_items")
public class RequestItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "purchase_request_id",
        nullable = false
    )
    private PurchaseRequestEntity purchaseRequest;

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

    protected RequestItemEntity() {
        // JPA
    }

    public RequestItemEntity(
        String description,
        Integer quantity,
        BigDecimal unitPrice
    ) {
        updateDetails(description, quantity, unitPrice);
    }

    public void updateDetails(String description,Integer quantity,BigDecimal unitPrice) {
        if (purchaseRequest != null
                && !purchaseRequest.isEditable()) {
            throw new IllegalStateException(
                "Não é permitido alterar itens desta solicitação."
            );
        }

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException(
                "A descrição do item é obrigatória."
            );
        }

        String normalizedDescription = description.trim();

        if (normalizedDescription.length() > 255) {
            throw new IllegalArgumentException(
                "A descrição deve ter no máximo 255 caracteres."
            );
        }

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException(
                "A quantidade deve ser maior que zero."
            );
        }

        Objects.requireNonNull(
            unitPrice,
            "O preço unitário é obrigatório."
        );

        if (unitPrice.signum() <= 0) {
            throw new IllegalArgumentException(
                "O preço unitário deve ser maior que zero."
            );
        }

        BigDecimal normalizedPrice = unitPrice.setScale(
            4,
            RoundingMode.UNNECESSARY
        );

        BigDecimal calculatedSubtotal = normalizedPrice
            .multiply(BigDecimal.valueOf(quantity))
            .setScale(4, RoundingMode.UNNECESSARY);

        // Evita ultrapassar NUMERIC(19,4) do PostgreSQL.
        if (calculatedSubtotal.precision()
                - calculatedSubtotal.scale() > 15) {
            throw new IllegalArgumentException(
                "O subtotal ultrapassa o limite permitido."
            );
        }

        this.description = normalizedDescription;
        this.quantity = quantity;
        this.unitPrice = normalizedPrice;
        this.subtotal = calculatedSubtotal;

        if (purchaseRequest != null) {
            purchaseRequest.touch();
        }
    }

    public void setPurchaseRequest(
        PurchaseRequestEntity purchaseRequest
    ) {
        this.purchaseRequest = purchaseRequest;
    }

    public Long getId() {
        return id;
    }

    public PurchaseRequestEntity getPurchaseRequest() {
        return purchaseRequest;
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
