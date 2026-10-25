
package com.kingspanisoeste.budget.controller;

import com.kingspanisoeste.budget.dto.*;
import com.kingspanisoeste.budget.service.AdminBudgetService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/budgets")
public class AdminBudgetController {

    private final AdminBudgetService service;

    public AdminBudgetController(AdminBudgetService service) {
        this.service = service;
    }

    @GetMapping
    public List<MonthlyBudgetResponseDTO> list(
        @AuthenticationPrincipal Jwt jwt
    ) {
        AdminAccess.requireAdmin(jwt);

        return service.list();
    }

    @PostMapping
    public ResponseEntity<MonthlyBudgetResponseDTO> create(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody CreateMonthlyBudgetDTO dto
    ) {
        AdminAccess.requireAdmin(jwt);

        MonthlyBudgetResponseDTO response =
            service.create(dto);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }

    @PutMapping("/{id}")
    public MonthlyBudgetResponseDTO update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long id,
        @RequestBody UpdateMonthlyBudgetDTO dto
    ) {
        AdminAccess.requireAdmin(jwt);

        return service.update(id, dto);
    }
}
