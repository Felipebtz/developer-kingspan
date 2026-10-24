package com.kingspanisoeste.auth.dto;

import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;

public record AdminUserResponseDTO(
    Long id,
    String name,
    String email,
    UserRole role,
    UserStatus status,
    Long costCenterId,
    ApproverLevel approverLevel
) {
    
}
