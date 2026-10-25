package com.kingspanisoeste.purchaserequest.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import java.util.List;


public interface RequestVersionRepository extends JpaRepository<RequestVersionEntity, Long>  {

    Optional<RequestVersionEntity>findById(Long id);

    List<RequestVersionEntity>
    findByPurchaseRequestId(Long purchaseRequestId);

    List<RequestVersionEntity>findByPurchaseRequestIdOrderByVersionNumberDesc(Long purchaseRequestId);

    Optional<RequestVersionEntity>findByPurchaseRequestIdAndVersionNumber(Long purchaseRequestId, Integer versionNumber);

    Optional<RequestVersionEntity>findFirstByPurchaseRequestIdOrderByVersionNumberDesc(Long purchaseRequestId);

    boolean existsByPurchaseRequestIdAndVersionNumber( Long purchaseRequestId, Integer versionNumber);
}
    

