package com.kingspanisoeste.purchaserequest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.service.BudgetService;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestPolicy;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock PurchaseRequestRepository requestRepository;
    @Mock RequestVersionRepository versionRepository;
    @Mock ApprovalStepRepository stepRepository;
    @Mock UserRepository userRepository;
    @Mock PurchaseRequestPolicy policy;
    @Mock BudgetService budgetService;
    @Mock PurchaseRequestAuditService auditService;

    private ApprovalService service;

    @BeforeEach
    void setUp() {
        service = new ApprovalService(
            requestRepository, versionRepository, stepRepository,
            userRepository, policy, budgetService, auditService
        );
    }

    @Test
    void deveConsumirOrcamentoSomenteNaAprovacaoFinal() {
        Scenario scenario = scenario(List.of(
            new ApprovalStepEntity(200L, 1, ApprovalRequiredLevel.ADMIN, true)
        ));

        service.approve(100L, 1L, "De acordo", 30L, "trace-final");

        assertEquals(PurchaseRequestStatus.APPROVED, scenario.request().getStatus());
        assertEquals(ApprovalStepStatus.APPROVED, scenario.steps().get(0).getStatus());
        verify(budgetService).consumeForFinalApproval(scenario.version());
        verify(requestRepository).saveAndFlush(scenario.request());
        verify(auditService).record(
            scenario.request(), 30L, "ADMIN", "REQUEST_APPROVED",
            PurchaseRequestStatus.PENDING_APPROVAL, PurchaseRequestStatus.APPROVED,
            1, 1, ApprovalRequiredLevel.ADMIN, "trace-final", "De acordo"
        );
    }

    @Test
    void saldoInsuficienteNaoDeveAlterarEtapaPedidoOuAuditoria() {
        Scenario scenario = scenario(List.of(
            new ApprovalStepEntity(200L, 1, ApprovalRequiredLevel.ADMIN, true)
        ));
        org.mockito.Mockito.doThrow(new BusinessException(
            HttpStatus.UNPROCESSABLE_CONTENT, "BUDGET_EXCEEDED", "Sem saldo"))
            .when(budgetService).consumeForFinalApproval(scenario.version());

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.approve(100L, 1L, null, 30L, "trace-fail"));

        assertEquals("BUDGET_EXCEEDED", exception.getCode());
        assertEquals(PurchaseRequestStatus.PENDING_APPROVAL, scenario.request().getStatus());
        assertEquals(ApprovalStepStatus.PENDING, scenario.steps().get(0).getStatus());
        verify(requestRepository, never()).saveAndFlush(any());
        verifyNoInteractions(auditService);
    }

    @Test
    void aprovacaoIntermediariaDeveAtivarProximaSemConsumirOrcamento() {
        ApprovalStepEntity current = new ApprovalStepEntity(
            200L, 1, ApprovalRequiredLevel.NIVEL_1, true);
        ApprovalStepEntity next = new ApprovalStepEntity(
            200L, 2, ApprovalRequiredLevel.NIVEL_2, false);
        Scenario scenario = scenario(List.of(current, next));

        service.approve(100L, 1L, null, 30L, "trace-step");

        assertEquals(PurchaseRequestStatus.PENDING_APPROVAL, scenario.request().getStatus());
        assertEquals(ApprovalStepStatus.APPROVED, current.getStatus());
        assertEquals(ApprovalStepStatus.PENDING, next.getStatus());
        verifyNoInteractions(budgetService);
        verify(auditService).record(
            scenario.request(), 30L, "ADMIN", "STEP_APPROVED",
            PurchaseRequestStatus.PENDING_APPROVAL,
            PurchaseRequestStatus.PENDING_APPROVAL,
            1, 1, ApprovalRequiredLevel.NIVEL_1, "trace-step", null
        );
    }

    private Scenario scenario(List<ApprovalStepEntity> steps) {
        PurchaseRequestEntity request = new PurchaseRequestEntity(10L, 20L);
        ReflectionTestUtils.setField(request, "id", 100L);
        ReflectionTestUtils.setField(request, "lockVersion", 1L);
        request.markSubmitted(1, Instant.now());

        RequestVersionEntity version = org.mockito.Mockito.mock(RequestVersionEntity.class);
        when(version.getId()).thenReturn(200L);
        lenient().when(version.getVersionNumber()).thenReturn(1);

        UserEntity actor = org.mockito.Mockito.mock(UserEntity.class);
        lenient().when(actor.getId()).thenReturn(30L);
        lenient().when(actor.getRole()).thenReturn(UserRole.ADMIN);

        when(requestRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(request));
        when(userRepository.findById(30L)).thenReturn(Optional.of(actor));
        when(versionRepository.findByPurchaseRequestIdAndVersionNumber(100L, 1))
            .thenReturn(Optional.of(version));
        when(stepRepository.findByRequestVersionIdOrderByStepOrderAsc(200L))
            .thenReturn(steps);
        lenient().when(requestRepository.saveAndFlush(request)).thenReturn(request);

        return new Scenario(request, version, steps);
    }

    private record Scenario(
        PurchaseRequestEntity request,
        RequestVersionEntity version,
        List<ApprovalStepEntity> steps
    ) {}
}
