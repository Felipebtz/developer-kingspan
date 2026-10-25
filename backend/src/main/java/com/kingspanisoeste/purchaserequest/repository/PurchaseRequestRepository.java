
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

    @Query(
        value = """
            SELECT request.*
              FROM purchase_requests request
              JOIN request_versions version
                ON version.purchase_request_id = request.id
               AND version.version_number = request.current_version
              JOIN approval_steps current_step
                ON current_step.request_version_id = version.id
               AND current_step.status = 'PENDING'
             WHERE request.status = 'PENDING_APPROVAL'
               AND request.requester_id <> :actorId
               AND NOT EXISTS (
                    SELECT 1
                      FROM approval_steps previous_step
                     WHERE previous_step.request_version_id = version.id
                       AND previous_step.approver_id = :actorId
                       AND previous_step.status = 'APPROVED'
               )
               AND (
                    :role = 'ADMIN'
                    OR (
                        :role = 'APROVADOR'
                        AND request.cost_center_id = :costCenterId
                        AND (
                            (
                                current_step.required_level = 'NIVEL_1'
                                AND :approverLevel IN ('NIVEL_1', 'NIVEL_2')
                            )
                            OR (
                                current_step.required_level = 'NIVEL_2'
                                AND :approverLevel = 'NIVEL_2'
                            )
                        )
                    )
               )
             ORDER BY request.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
              FROM purchase_requests request
              JOIN request_versions version
                ON version.purchase_request_id = request.id
               AND version.version_number = request.current_version
              JOIN approval_steps current_step
                ON current_step.request_version_id = version.id
               AND current_step.status = 'PENDING'
             WHERE request.status = 'PENDING_APPROVAL'
               AND request.requester_id <> :actorId
               AND NOT EXISTS (
                    SELECT 1
                      FROM approval_steps previous_step
                     WHERE previous_step.request_version_id = version.id
                       AND previous_step.approver_id = :actorId
                       AND previous_step.status = 'APPROVED'
               )
               AND (
                    :role = 'ADMIN'
                    OR (
                        :role = 'APROVADOR'
                        AND request.cost_center_id = :costCenterId
                        AND (
                            (
                                current_step.required_level = 'NIVEL_1'
                                AND :approverLevel IN ('NIVEL_1', 'NIVEL_2')
                            )
                            OR (
                                current_step.required_level = 'NIVEL_2'
                                AND :approverLevel = 'NIVEL_2'
                            )
                        )
                    )
               )
            """,
        nativeQuery = true
    )
    Page<PurchaseRequestEntity> findApprovalInbox(
        @Param("actorId") Long actorId,
        @Param("role") String role,
        @Param("costCenterId") Long costCenterId,
        @Param("approverLevel") String approverLevel,
        Pageable pageable
    );
}
