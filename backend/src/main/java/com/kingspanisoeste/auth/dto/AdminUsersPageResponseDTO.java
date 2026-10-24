
package com.kingspanisoeste.auth.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record AdminUsersPageResponseDTO(
    List<AdminUserResponseDTO> data,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static AdminUsersPageResponseDTO from(
            Page<AdminUserResponseDTO> result
    ) {
        return new AdminUsersPageResponseDTO(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages()
        );
    }
}
