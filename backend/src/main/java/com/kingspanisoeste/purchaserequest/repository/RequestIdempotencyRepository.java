package com.kingspanisoeste.purchaserequest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.purchaserequest.entity.RequestIdempotencyEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.IdempotencyProcessingStatus;

public interface RequestIdempotencyRepository extends JpaRepository<RequestIdempotencyEntity, Long> {

    Optional<RequestIdempotencyEntity>findByIdempotencyKey(String idempotencyKey);

    Optional<RequestIdempotencyEntity>findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    boolean existsByUserIdAndIdempotencyKey( Long userId, String idempotencyKey);

    List<RequestIdempotencyEntity> findByProcessingStatus(IdempotencyProcessingStatus status);
}