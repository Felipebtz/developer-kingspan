package com.kingspanisoeste.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.auth.entity.UserEntity;

public interface UserRepository extends  JpaRepository<UserEntity, Long>{
    
}
