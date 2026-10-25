package com.kingspanisoeste.purchaserequest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.purchaserequest.domain.PurchaseAmountCalculator;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestPolicy;
import com.kingspanisoeste.purchaserequest.dto.CreatePurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.dto.PurchaseRequestResponseDTO;
import com.kingspanisoeste.purchaserequest.dto.RequestItemDTO;
import com.kingspanisoeste.purchaserequest.dto.UpdatePurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestIdempotencyEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestRepository;
import com.kingspanisoeste.purchaserequest.repository.ApprovalStepRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestIdempotencyRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestVersionRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class PurchaseRequestServiceTest {

    @Mock PurchaseRequestRepository requestRepository;
    @Mock UserRepository userRepository;
    @Mock CostCenterRepository costCenterRepository;
    @Mock RequestIdempotencyRepository idempotencyRepository;
    @Mock RequestVersionRepository versionRepository;
    @Mock ApprovalStepRepository stepRepository;
    @Mock PurchaseRequestPolicy policy;
    @Mock PurchaseAmountCalculator amountCalculator;
    @Mock PurchaseRequestAuditService auditService;

    private ObjectMapper objectMapper;
    private PurchaseRequestService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        service = new PurchaseRequestService(
            requestRepository,
            userRepository,
            costCenterRepository,
            idempotencyRepository,
            versionRepository,
            stepRepository,
            policy,
            amountCalculator,
            auditService,
            objectMapper
        );
    }

    @Test
    void deveCriarDraftRecalculandoTotalEAuditandoUmaVez() {
        CostCenterEntity costCenter = costCenter(20L, true);
        UserEntity user = user(10L, costCenter);
        CreatePurchaseRequestDTO dto = createDto(new BigDecimal("9999.00"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(costCenterRepository.findById(20L)).thenReturn(Optional.of(costCenter));
        when(amountCalculator.calculateTotal(anyList()))
            .thenReturn(new BigDecimal("149.7000"));
        when(requestRepository.saveAndFlush(any(PurchaseRequestEntity.class)))
            .thenAnswer(invocation -> {
                PurchaseRequestEntity request = invocation.getArgument(0);
                ReflectionTestUtils.setField(request, "id", 100L);
                ReflectionTestUtils.setField(request, "lockVersion", 0L);
                return request;
            });

        PurchaseRequestResponseDTO response = service.createDraft(
            dto, 10L, "SOLICITANTE", "trace-1", null, null);

        assertEquals(100L, response.id());
        assertEquals(PurchaseRequestStatus.DRAFT, response.status());
        assertEquals(0, response.currentVersion());
        assertEquals(0, response.totalAmount().compareTo(new BigDecimal("149.7000")));
        assertEquals(0, response.items().get(0).subtotal().compareTo(new BigDecimal("149.7000")));

        ArgumentCaptor<PurchaseRequestEntity> requestCaptor =
            ArgumentCaptor.forClass(PurchaseRequestEntity.class);
        verify(requestRepository).saveAndFlush(requestCaptor.capture());
        assertEquals(20L, requestCaptor.getValue().getCostCenterId());
        verify(auditService).record(
            requestCaptor.getValue(), 10L, "SOLICITANTE", "REQUEST_CREATED",
            null, PurchaseRequestStatus.DRAFT, 0, "trace-1", "Rascunho criado."
        );
        verifyNoInteractions(idempotencyRepository);
    }

    @Test
    void naoDeveCriarComCentroInativo() {
        CostCenterEntity costCenter = costCenter(20L, false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(user(10L, costCenter)));
        when(costCenterRepository.findById(20L)).thenReturn(Optional.of(costCenter));

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.createDraft(createDto(null), 10L, "SOLICITANTE", null, null, null));

        assertEquals("COST_CENTER_INACTIVE", exception.getCode());
        verify(requestRepository, never()).save(any());
        verifyNoInteractions(auditService);
    }

    @Test
    void deveRepetirRespostaConcluidaSemNovaPersistenciaOuAuditoria() {
        String hash = "a".repeat(64);
        PurchaseRequestResponseDTO storedResponse = response(55L);
        RequestIdempotencyEntity record = new RequestIdempotencyEntity(
            10L, "key-1", hash, Instant.parse("2026-01-01T00:00:00Z"));
        record.complete(55L, 201, objectMapper.valueToTree(storedResponse));
        when(idempotencyRepository.findByUserIdAndIdempotencyKey(10L, "key-1"))
            .thenReturn(Optional.of(record));

        PurchaseRequestResponseDTO replay = service.createDraft(
            createDto(null), 10L, "SOLICITANTE", "trace", "key-1", hash);

        assertEquals(storedResponse.id(), replay.id());
        assertEquals(0, storedResponse.totalAmount().compareTo(replay.totalAmount()));
        verify(requestRepository, never()).save(any());
        verifyNoInteractions(userRepository, costCenterRepository, auditService);
    }

    @Test
    void naoDeveReutilizarChaveComPayloadDiferente() {
        RequestIdempotencyEntity record = new RequestIdempotencyEntity(
            10L, "key-1", "a".repeat(64), Instant.now());
        when(idempotencyRepository.findByUserIdAndIdempotencyKey(10L, "key-1"))
            .thenReturn(Optional.of(record));

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.createDraft(
                createDto(null), 10L, "SOLICITANTE", null, "key-1", "b".repeat(64)));

        assertEquals("IDEMPOTENCY_CONFLICT", exception.getCode());
        verify(requestRepository, never()).save(any());
        verifyNoInteractions(auditService);
    }

    @Test
    void naoDeveEditarComLockVersionDesatualizado() {
        PurchaseRequestEntity request = new PurchaseRequestEntity(10L, 20L);
        ReflectionTestUtils.setField(request, "id", 100L);
        ReflectionTestUtils.setField(request, "lockVersion", 3L);
        when(requestRepository.findById(100L)).thenReturn(Optional.of(request));
        UpdatePurchaseRequestDTO dto = new UpdatePurchaseRequestDTO(
            2L, null, "Novo", "Descrição", PurchaseCategory.EQUIPMENT,
            LocalDate.now().plusDays(30), List.of()
        );

        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.updateDraft(100L, dto, 10L, "SOLICITANTE", "trace"));

        assertEquals("CONCURRENT_MODIFICATION", exception.getCode());
        verify(requestRepository, never()).saveAndFlush(any());
        verifyNoInteractions(auditService);
    }

    private CreatePurchaseRequestDTO createDto(BigDecimal clientSubtotal) {
        return new CreatePurchaseRequestDTO(
            null,
            "Compra",
            "Descrição",
            PurchaseCategory.EQUIPMENT,
            LocalDate.now().plusDays(30),
            List.of(new RequestItemDTO(
                null, "Item", 3, new BigDecimal("49.90"), clientSubtotal))
        );
    }

    private CostCenterEntity costCenter(Long id, boolean active) {
        CostCenterEntity costCenter = new CostCenterEntity("CC", "Centro", null);
        ReflectionTestUtils.setField(costCenter, "id", id);
        if (!active) {
            costCenter.deactivate();
        }
        return costCenter;
    }

    private UserEntity user(Long id, CostCenterEntity costCenter) {
        UserEntity user = new UserEntity("Usuário", "user@email.com", "hash", costCenter);
        user.setId(id);
        return user;
    }

    private PurchaseRequestResponseDTO response(Long id) {
        return new PurchaseRequestResponseDTO(
            id, 10L, 20L, "Compra", "Descrição", PurchaseCategory.EQUIPMENT,
            LocalDate.of(2026, 2, 1), new BigDecimal("149.7000"),
            PurchaseRequestStatus.DRAFT, 0, 0L, null, null, null,
            List.of(), List.of("EDIT", "SUBMIT", "CANCEL")
        );
    }
}
