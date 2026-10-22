package com.kingspanisoeste.auth.repository;



import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
 
public interface UserRepository extends JpaRepository<UserEntity, Long>{
    boolean existsByEmail(String email);
    boolean existsByRole(UserRole role);
}
