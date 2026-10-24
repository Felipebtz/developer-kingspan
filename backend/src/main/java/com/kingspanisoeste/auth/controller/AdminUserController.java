package com.kingspanisoeste.auth.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kingspanisoeste.auth.dto.AdminUserResponseDTO;
import com.kingspanisoeste.auth.dto.AdminUsersPageResponseDTO;
import com.kingspanisoeste.auth.dto.UserActivationRequestDTO;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.service.AdminUserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<AdminUsersPageResponseDTO> list(
        @RequestParam(required = false) UserStatus status, 
        Pageable pageable
    ) {
        
        Page<AdminUserResponseDTO> result = adminUserService.listUsersByStatus(status, pageable);

        return ResponseEntity.ok(AdminUsersPageResponseDTO.from(result));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<AdminUserResponseDTO> activate(
        @PathVariable Long id, 
        @Valid @RequestBody UserActivationRequestDTO request
    ) {
        return ResponseEntity.ok(adminUserService.activateUser(id, request));
    }
}