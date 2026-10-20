package com.kingspanisoeste.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.entity.UserEntity;

public interface UserRepository extends  JpaRepository<UserEntity, Long>{
    
}
