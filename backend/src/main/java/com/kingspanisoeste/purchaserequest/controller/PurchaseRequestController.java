
package com.kingspanisoeste.purchaserequest.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kingspanisoeste.purchaserequest.dto.*;
import com.kingspanisoeste.purchaserequest.service.PurchaseRequestService;
import com.kingspanisoeste.purchaserequest.service.SubmitPurchaseRequestService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/requests")
public class PurchaseRequestController {

    private final PurchaseRequestService requestService;
    private final SubmitPurchaseRequestService submitService;
    private final ObjectMapper objectMapper;

    public PurchaseRequestController(PurchaseRequestService requestService, SubmitPurchaseRequestService submitService, ObjectMapper objectMapper) {
        this.requestService = requestService;
        this.submitService = submitService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<PurchaseRequestResponseDTO> createDraft(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @Valid @RequestBody CreatePurchaseRequestDTO dto,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        String role = jwt.getClaimAsString("role");
        String payloadHash = calculatePayloadHash(dto);

        PurchaseRequestResponseDTO response = requestService.createDraft(dto, userId, role, requestId, idempotencyKey, payloadHash);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        String role = jwt.getClaimAsString("role");

        PurchaseRequestResponseDTO response = requestService.findByIdAndUserVisibility(id, userId, role);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> updateDraft(
            @PathVariable Long id,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @Valid @RequestBody UpdatePurchaseRequestDTO dto,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        String role = jwt.getClaimAsString("role");

        PurchaseRequestResponseDTO response = requestService.updateDraft(id, dto, userId, role, requestId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitRequest(
            @PathVariable Long id,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @Valid @RequestBody SubmitPurchaseRequestDTO dto,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        String role = jwt.getClaimAsString("role");

        submitService.submitRequest(id, dto, userId, role, requestId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<PurchaseRequestResponseDTO>> listRequests(Pageable pageable, @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());
        String role = jwt.getClaimAsString("role");

        Page<PurchaseRequestResponseDTO> page = requestService.listRequests(pageable, userId, role);

        return ResponseEntity.ok(page);
    }

    private String calculatePayloadHash(CreatePurchaseRequestDTO dto) {
        try {
            byte[] payload = objectMapper.writeValueAsBytes(dto);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(payload);
            return HexFormat.of().formatHex(hash);
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("Erro ao calcular hash da solicitação.", e);
        }
    }
}
