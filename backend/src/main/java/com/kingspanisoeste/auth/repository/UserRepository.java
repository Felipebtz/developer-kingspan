package com.kingspanisoeste.auth.repository;



import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;

 
public interface UserRepository extends JpaRepository<UserEntity, Long>{

    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByRole(UserRole role);
    org.springframework.data.domain.Page<UserEntity> findByStatus(UserStatus status, org.springframework.data.domain.Pageable pageable);
    long countByRoleAndStatus(UserRole role, UserStatus status);
}
