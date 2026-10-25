package com.kingspanisoeste.purchaserequest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;


public interface ApprovalStepRepository extends JpaRepository<ApprovalStepEntity, Long> {
        Optional<ApprovalStepEntity>findById(Long id);

    List<ApprovalStepEntity>findByRequestVersionId(Long requestVersionId);

    List<ApprovalStepEntity>findByRequestVersionIdOrderByStepOrderAsc(Long requestVersionId);

    Optional<ApprovalStepEntity>
    findByRequestVersionIdAndStepOrder(Long requestVersionId,Integer stepOrder);

    List<ApprovalStepEntity>findByStatus(ApprovalStepStatus status);

    List<ApprovalStepEntity>findByApproverId(Long approverId);

    List<ApprovalStepEntity>
    findByApproverIdAndStatus(Long approverId,ApprovalStepStatus status);

    Optional<ApprovalStepEntity>
    findFirstByRequestVersionIdAndStatus(Long requestVersionId,ApprovalStepStatus status);

    boolean existsByRequestVersionIdAndApproverIdAndStatus(
        Long requestVersionId,
        Long approverId,
        ApprovalStepStatus status
    );
}

