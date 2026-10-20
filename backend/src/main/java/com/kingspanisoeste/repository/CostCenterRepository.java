package com.kingspanisoeste.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.entity.CostCenterEntity;

public interface CostCenterRepository extends JpaRepository<CostCenterEntity, Long>{
    
}
