package com.kingspanisoeste.purchaserequest.controller;

import com.kingspanisoeste.purchaserequest.dto.PurchaseRequestResponseDTO;
import com.kingspanisoeste.purchaserequest.service.PurchaseRequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/approvals")
public class ApprovalInboxController {

    private final PurchaseRequestService requestService;

    public ApprovalInboxController(PurchaseRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping("/inbox")
    public ResponseEntity<Page<PurchaseRequestResponseDTO>> inbox(
        Pageable pageable,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(
            requestService.listApprovalInbox(
                pageable,
                Long.valueOf(jwt.getSubject())
            )
        );
    }
}
