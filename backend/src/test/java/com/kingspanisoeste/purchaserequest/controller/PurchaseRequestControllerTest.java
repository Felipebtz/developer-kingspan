package com.kingspanisoeste.purchaserequest.controller;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kingspanisoeste.purchaserequest.dto.PurchaseRequestResponseDTO;
import com.kingspanisoeste.purchaserequest.service.PurchaseRequestService;
import com.kingspanisoeste.purchaserequest.service.SubmitPurchaseRequestService;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

class PurchaseRequestControllerTest {

    @Test
    void deveObterRequesterIdDoJwtAoListarSomenteAsPropriasSolicitacoes() {
        PurchaseRequestService requestService = mock(PurchaseRequestService.class);
        SubmitPurchaseRequestService submitService = mock(SubmitPurchaseRequestService.class);
        PurchaseRequestController controller = new PurchaseRequestController(
            requestService, submitService, new ObjectMapper());
        Pageable pageable = PageRequest.of(0, 20);
        Page<PurchaseRequestResponseDTO> expected = Page.empty(pageable);
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("42");
        when(jwt.getClaimAsString("role")).thenReturn("APROVADOR");
        when(requestService.listRequests(pageable, 42L, "APROVADOR", true))
            .thenReturn(expected);

        ResponseEntity<Page<PurchaseRequestResponseDTO>> response =
            controller.listRequests(pageable, true, jwt);

        assertSame(expected, response.getBody());
        verify(requestService).listRequests(pageable, 42L, "APROVADOR", true);
    }
}
