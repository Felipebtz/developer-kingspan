
package com.kingspanisoeste.purchaserequest.repository;

import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;



public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequestEntity, Long>, JpaSpecificationExecutor<PurchaseRequestEntity> {

    Page<PurchaseRequestEntity> findByRequesterId(Long requesterId, Pageable pageable);

    Page<PurchaseRequestEntity> findByCostCenterId(Long costCenterId, Pageable pageable);

    Optional<PurchaseRequestEntity> findByTitle(String title);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from PurchaseRequestEntity request where request.id = :id")
    Optional<PurchaseRequestEntity> findByIdForUpdate(@Param("id") Long id);
}
