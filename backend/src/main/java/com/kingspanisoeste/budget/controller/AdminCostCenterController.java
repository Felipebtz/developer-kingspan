
package com.kingspanisoeste.budget.controller;

import com.kingspanisoeste.budget.dto.*;
import com.kingspanisoeste.budget.service.CostCenterService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/cost-centers")
public class AdminCostCenterController {

    private final CostCenterService service;

    public AdminCostCenterController(CostCenterService service) {
        this.service = service;
    }

    @GetMapping
    public List<CostCenterResponseDTO> list(
        @AuthenticationPrincipal Jwt jwt
    ) {
        AdminAccess.requireAdmin(jwt);

        return service.list();
    }

    @PostMapping
    public ResponseEntity<CostCenterResponseDTO> create(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody CreateCostCenterDTO dto
    ) {
        AdminAccess.requireAdmin(jwt);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.create(dto));
    }
}
