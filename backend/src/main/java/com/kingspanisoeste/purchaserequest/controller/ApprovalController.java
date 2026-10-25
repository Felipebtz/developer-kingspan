package com.kingspanisoeste.purchaserequest.controller;

import com.kingspanisoeste.purchaserequest.dto.ApprovalDecisionDTO;
import com.kingspanisoeste.purchaserequest.dto.CancelPurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.service.ApprovalService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/requests/{requestId}")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping("/approve")
    public ResponseEntity<Void> approve(
        @PathVariable Long requestId,
        @RequestHeader(value = "X-Request-Id", required = false) String tracingId,
        @Valid @RequestBody ApprovalDecisionDTO dto,
        @AuthenticationPrincipal Jwt jwt
    ) {
        approvalService.approve(
            requestId,
            dto.lockVersion(),
            dto.comment(),
            Long.valueOf(jwt.getSubject()),
            tracingId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reject")
    public ResponseEntity<Void> reject(
        @PathVariable Long requestId,
        @RequestHeader(value = "X-Request-Id", required = false) String tracingId,
        @Valid @RequestBody ApprovalDecisionDTO dto,
        @AuthenticationPrincipal Jwt jwt
    ) {
        approvalService.reject(
            requestId,
            dto.lockVersion(),
            dto.comment(),
            Long.valueOf(jwt.getSubject()),
            tracingId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request-changes")
    public ResponseEntity<Void> requestChanges(
        @PathVariable Long requestId,
        @RequestHeader(value = "X-Request-Id", required = false) String tracingId,
        @Valid @RequestBody ApprovalDecisionDTO dto,
        @AuthenticationPrincipal Jwt jwt
    ) {
        approvalService.requestChanges(
            requestId,
            dto.lockVersion(),
            dto.comment(),
            Long.valueOf(jwt.getSubject()),
            tracingId
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/cancel")
    public ResponseEntity<Void> cancel(
        @PathVariable Long requestId,
        @RequestHeader(value = "X-Request-Id", required = false) String tracingId,
        @Valid @RequestBody CancelPurchaseRequestDTO dto,
        @AuthenticationPrincipal Jwt jwt
    ) {
        approvalService.cancel(
            requestId,
            dto.lockVersion(),
            Long.valueOf(jwt.getSubject()),
            tracingId
        );
        return ResponseEntity.noContent().build();
    }
}
