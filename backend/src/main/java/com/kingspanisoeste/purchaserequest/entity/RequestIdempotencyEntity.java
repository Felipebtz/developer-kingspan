
package com.kingspanisoeste.purchaserequest.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.kingspanisoeste.purchaserequest.entity.enums.IdempotencyProcessingStatus;

import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.regex.Pattern;

@Entity
@Table(name = "request_idempotency")
public class RequestIdempotencyEntity {

    private static final Duration TTL = Duration.ofHours(24);

    private static final Pattern SHA256 =
        Pattern.compile("[0-9a-fA-F]{64}");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(
        name = "idempotency_key",
        nullable = false,
        length = 255
    )
    private String idempotencyKey;

    @Column(
        name = "payload_hash",
        nullable = false,
        length = 64
    )
    private String payloadHash;

    @Column(name = "purchase_request_id")
    private Long purchaseRequestId;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "processing_status",
        nullable = false,
        length = 20
    )
    private IdempotencyProcessingStatus processingStatus =
        IdempotencyProcessingStatus.PROCESSING;

    @Column(name = "response_status")
    private Integer responseStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_body", columnDefinition = "jsonb")
    private JsonNode responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected RequestIdempotencyEntity() {
        // JPA
    }

    public RequestIdempotencyEntity(
        Long userId,
        String idempotencyKey,
        String payloadHash,
        Instant createdAt
    ) {
        this.userId = Objects.requireNonNull(userId);

        if (idempotencyKey == null
                || idempotencyKey.isBlank()
                || idempotencyKey.length() > 255) {
            throw new IllegalArgumentException(
                "Idempotency-Key inválida."
            );
        }

        if (payloadHash == null
                || !SHA256.matcher(payloadHash).matches()) {
            throw new IllegalArgumentException(
                "O hash deve ser SHA-256 hexadecimal."
            );
        }

        this.idempotencyKey = idempotencyKey;
        this.payloadHash = payloadHash.toLowerCase();

        this.createdAt = Objects.requireNonNull(createdAt);
        this.expiresAt = createdAt.plus(TTL);
    }

    public boolean matchesPayload(String hash) {
        return hash != null
            && payloadHash.equalsIgnoreCase(hash);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public boolean isCompleted() {
        return processingStatus ==
            IdempotencyProcessingStatus.COMPLETED;
    }

    public void complete(
        Long purchaseRequestId,
        int responseStatus,
        JsonNode responseBody
    ) {
        if (isCompleted()) {
            throw new IllegalStateException(
                "A operação já foi concluída."
            );
        }

        if (responseStatus < 200 || responseStatus >= 300) {
            throw new IllegalArgumentException(
                "Resposta de criação inválida."
            );
        }

        this.purchaseRequestId =
            Objects.requireNonNull(purchaseRequestId);

        this.responseStatus = responseStatus;

        this.responseBody = Objects
            .requireNonNull(responseBody)
            .deepCopy();

        this.processingStatus =
            IdempotencyProcessingStatus.COMPLETED;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public Long getPurchaseRequestId() {
        return purchaseRequestId;
    }

    public IdempotencyProcessingStatus getProcessingStatus() {
        return processingStatus;
    }

    public Integer getResponseStatus() {
        return responseStatus;
    }

    public JsonNode getResponseBody() {
        return responseBody == null
            ? null
            : responseBody.deepCopy();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
