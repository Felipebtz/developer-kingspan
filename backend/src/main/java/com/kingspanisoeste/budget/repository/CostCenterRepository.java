package com.kingspanisoeste.budget.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.budget.entity.CostCenterEntity;

public interface CostCenterRepository extends JpaRepository<CostCenterEntity, Long>{
    

    
}
