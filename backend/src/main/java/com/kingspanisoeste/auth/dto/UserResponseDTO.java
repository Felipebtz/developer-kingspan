
package com.kingspanisoeste.auth.dto;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;

public record UserResponseDTO(
    Long id,
    String name,
    String email,
    UserRole role,
    UserStatus status,
    ApproverLevel approverLevel,
    Long costCenterId
) {

    public static UserResponseDTO from(UserEntity user) {
        return new UserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getApproverLevel(),
            user.getCostCenterEntity() != null
                ? user.getCostCenterEntity().getId()
                : null
        );
    }
}
