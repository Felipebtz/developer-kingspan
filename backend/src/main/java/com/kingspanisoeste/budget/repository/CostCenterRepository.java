package com.kingspanisoeste.budget.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import com.kingspanisoeste.budget.entity.CostCenterEntity;

public interface CostCenterRepository extends JpaRepository<CostCenterEntity, Long>{
    Optional<CostCenterEntity> findByCode(String code);
}
