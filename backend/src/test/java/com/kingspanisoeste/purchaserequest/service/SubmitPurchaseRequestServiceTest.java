package com.kingspanisoeste.purchaserequest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.kingspanisoeste.purchaserequest.domain.ApprovalFlowFactory;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestPolicy;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestValidator;
import com.kingspanisoeste.purchaserequest.dto.SubmitPurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestItemEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.repository.ApprovalStepRepository;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestVersionRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class SubmitPurchaseRequestServiceTest {

    @Mock PurchaseRequestRepository requestRepository;
    @Mock RequestVersionRepository versionRepository;
    @Mock ApprovalStepRepository stepRepository;
    @Mock PurchaseRequestPolicy policy;
    @Mock PurchaseRequestValidator validator;
    @Mock ApprovalFlowFactory flowFactory;
    @Mock PurchaseRequestAuditService auditService;

    private SubmitPurchaseRequestService service;

    @BeforeEach
    void setUp() {
        service = new SubmitPurchaseRequestService(
            requestRepository, versionRepository, stepRepository,
            policy, validator, flowFactory, auditService
        );
    }

    @Test
    void deveSubmeterDraftGerandoSnapshotEtapasEAuditoria() {
        PurchaseRequestEntity request = validDraft();
        when(requestRepository.findById(100L)).thenReturn(Optional.of(request));
        when(requestRepository.saveAndFlush(request)).thenReturn(request);
        when(versionRepository.saveAndFlush(any(RequestVersionEntity.class)))
            .thenAnswer(invocation -> {
                RequestVersionEntity version = invocation.getArgument(0);
                ReflectionTestUtils.setField(version, "id", 200L);
                return version;
            });
        when(flowFactory.generateSteps(any(RequestVersionEntity.class)))
            .thenAnswer(invocation -> List.of(new ApprovalStepEntity(
                ((RequestVersionEntity) invocation.getArgument(0)).getId(),
                1, ApprovalRequiredLevel.NIVEL_1, true)));

        service.submitRequest(
            100L, new SubmitPurchaseRequestDTO(0L), 10L,
            "SOLICITANTE", "trace-submit");

        assertEquals(PurchaseRequestStatus.PENDING_APPROVAL, request.getStatus());
        assertEquals(1, request.getCurrentVersion());
        verify(validator).validateForSubmission(request);
        verify(versionRepository).saveAndFlush(any(RequestVersionEntity.class));
        verify(stepRepository).saveAll(any());
        verify(auditService).record(
            request, 10L, "SOLICITANTE", "REQUEST_SUBMITTED",
            PurchaseRequestStatus.DRAFT, PurchaseRequestStatus.PENDING_APPROVAL,
            1, "trace-submit", "Solicitação submetida para aprovação."
        );
    }

    @Test
    void deveReenviarChangesRequestedComoVersaoDois() {
        PurchaseRequestEntity request = validDraft();
        request.markSubmitted(1, Instant.now());
        request.markChangesRequested();
        ReflectionTestUtils.setField(request, "lockVersion", 1L);
        when(requestRepository.findById(100L)).thenReturn(Optional.of(request));
        when(requestRepository.saveAndFlush(request)).thenReturn(request);
        when(versionRepository.saveAndFlush(any(RequestVersionEntity.class)))
            .thenAnswer(invocation -> {
                RequestVersionEntity version = invocation.getArgument(0);
                ReflectionTestUtils.setField(version, "id", 201L);
                return version;
            });
        when(flowFactory.generateSteps(any(RequestVersionEntity.class)))
            .thenReturn(List.of(new ApprovalStepEntity(
                201L, 1, ApprovalRequiredLevel.NIVEL_1, true)));

        service.submitRequest(
            100L, new SubmitPurchaseRequestDTO(1L), 10L,
            "SOLICITANTE", "trace-resubmit");

        assertEquals(2, request.getCurrentVersion());
        verify(auditService).record(
            request, 10L, "SOLICITANTE", "REQUEST_RESUBMITTED",
            PurchaseRequestStatus.CHANGES_REQUESTED,
            PurchaseRequestStatus.PENDING_APPROVAL,
            2, "trace-resubmit", "Solicitação submetida para aprovação."
        );
    }

    @Test
    void naoDeveSubmeterComLockVersionDesatualizado() {
        PurchaseRequestEntity request = validDraft();
        when(requestRepository.findById(100L)).thenReturn(Optional.of(request));

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.submitRequest(
                100L, new SubmitPurchaseRequestDTO(9L), 10L,
                "SOLICITANTE", null));

        assertEquals("CONCURRENT_MODIFICATION", exception.getCode());
        verifyNoInteractions(validator, versionRepository, stepRepository, auditService);
        verify(requestRepository, never()).saveAndFlush(any());
    }

    @Test
    void falhaDeValidacaoNaoDevePersistirSnapshotEtapaOuAuditoria() {
        PurchaseRequestEntity request = validDraft();
        when(requestRepository.findById(100L)).thenReturn(Optional.of(request));
        org.mockito.Mockito.doThrow(new BusinessException(
            HttpStatus.UNPROCESSABLE_CONTENT, "MISSING_ITEMS", "Sem itens"))
            .when(validator).validateForSubmission(request);

        assertThrows(BusinessException.class,
            () -> service.submitRequest(
                100L, new SubmitPurchaseRequestDTO(0L), 10L,
                "SOLICITANTE", null));

        verify(requestRepository, never()).saveAndFlush(any());
        verifyNoInteractions(versionRepository, stepRepository, auditService);
    }

    @Test
    void idInexistenteNaoDeveGerarSnapshotOuAuditoria() {
        when(requestRepository.findById(999L)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.submitRequest(
                999L, new SubmitPurchaseRequestDTO(0L), 10L,
                "SOLICITANTE", null));

        assertEquals("REQUEST_NOT_FOUND", exception.getCode());
        verifyNoInteractions(versionRepository, stepRepository, auditService, validator);
    }

    private PurchaseRequestEntity validDraft() {
        PurchaseRequestEntity request = new PurchaseRequestEntity(10L, 20L);
        request.updateDraft(
            20L, "Compra", "Descrição", PurchaseCategory.EQUIPMENT,
            LocalDate.now().plusDays(30));
        request.addItem(new RequestItemEntity("Item", 1, new BigDecimal("100.00")));
        request.updateTotal(new BigDecimal("100.0000"));
        ReflectionTestUtils.setField(request, "id", 100L);
        ReflectionTestUtils.setField(request, "lockVersion", 0L);
        return request;
    }
}
