
package com.kingspanisoeste.purchaserequest.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
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
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestIdempotencyEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestItemEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestRepository;
import com.kingspanisoeste.purchaserequest.repository.ApprovalStepRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestIdempotencyRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestVersionRepository;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;
import com.kingspanisoeste.budget.entity.enums.CostCenterStatus;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class PurchaseRequestService {

    private final PurchaseRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final CostCenterRepository costCenterRepository;
    private final RequestIdempotencyRepository idempotencyRepository;
    private final RequestVersionRepository versionRepository;
    private final ApprovalStepRepository stepRepository;
    private final PurchaseRequestPolicy policy;
    private final PurchaseAmountCalculator amountCalculator;
    private final PurchaseRequestAuditService auditService;
    private final ObjectMapper objectMapper;

    public PurchaseRequestService(
            PurchaseRequestRepository requestRepository,
            UserRepository userRepository,
            CostCenterRepository costCenterRepository,
            RequestIdempotencyRepository idempotencyRepository,
            RequestVersionRepository versionRepository,
            ApprovalStepRepository stepRepository,
            PurchaseRequestPolicy policy,
            PurchaseAmountCalculator amountCalculator,
            PurchaseRequestAuditService auditService,
            ObjectMapper objectMapper) {

        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.costCenterRepository = costCenterRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.versionRepository = versionRepository;
        this.stepRepository = stepRepository;
        this.policy = policy;
        this.amountCalculator = amountCalculator;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PurchaseRequestResponseDTO createDraft(CreatePurchaseRequestDTO dto, Long userId, String role, String requestId, String idempotencyKey, String payloadHash) {

        RequestIdempotencyEntity idempotencyRecord = null;

        // Verifica se a solicitação já foi criada
        if (idempotencyKey != null) {

            if (idempotencyKey.isBlank() || idempotencyKey.length() > 255) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_IDEMPOTENCY_KEY", "Chave de idempotência inválida.");
            }

            Optional<RequestIdempotencyEntity> existingOpt = idempotencyRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);

            if (existingOpt.isPresent()) {
                RequestIdempotencyEntity existing = existingOpt.get();

                if (!existing.matchesPayload(payloadHash)) {
                    throw new BusinessException(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "Chave reutilizada com payload diferente.");
                }

                if (existing.isCompleted()) {
                    try {
                        return objectMapper.treeToValue(existing.getResponseBody(), PurchaseRequestResponseDTO.class);
                    } catch (JsonProcessingException e) {
                        throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "SERIALIZATION_ERROR", "Falha ao recuperar resposta da solicitação.");
                    }
                }

                throw new BusinessException(HttpStatus.CONFLICT, "CONCURRENT_REQUEST", "A requisição está em processamento.");
            }

            idempotencyRecord = new RequestIdempotencyEntity(userId, idempotencyKey, payloadHash, Instant.now());

            try {
                idempotencyRepository.saveAndFlush(idempotencyRecord);
            } catch (DataIntegrityViolationException e) {
                throw new BusinessException(HttpStatus.CONFLICT, "CONCURRENT_REQUEST", "Requisição simultânea detectada.");
            }
        }

        // Valida usuário e centro de custo
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuário não encontrado."));

        Long costCenterId = resolveCostCenterId(user, role, dto.costCenterId());

        CostCenterEntity costCenter = costCenterRepository.findById(costCenterId)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "COST_CENTER_NOT_FOUND", "Centro de custo não encontrado."));

        if (costCenter.getStatus() != CostCenterStatus.ACTIVE) {
    throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "COST_CENTER_INACTIVE", "O centro de custo selecionado está inativo.");
    }

        // Cria o rascunho
        PurchaseRequestEntity request = new PurchaseRequestEntity(userId, costCenterId);
        request.updateDraft(costCenterId, dto.title(), dto.description(), dto.category(), dto.neededBy());

        if (dto.items() != null) {
            for (RequestItemDTO item : dto.items()) {
                request.addItem(new RequestItemEntity(item.description(), item.quantity(), item.unitPrice()));
            }
        }

        recalculateTotal(request);

        PurchaseRequestEntity savedRequest = requestRepository.saveAndFlush(request);

        // Registra a criação no histórico
        auditService.record(
                savedRequest, userId, role != null ? role : "SOLICITANTE",
                "REQUEST_CREATED", null, PurchaseRequestStatus.DRAFT,
                savedRequest.getCurrentVersion(), requestId, "Rascunho criado."
        );

        PurchaseRequestResponseDTO response = mapToResponse(savedRequest, user);

        // Guarda a resposta para evitar criação duplicada
        if (idempotencyRecord != null) {
            idempotencyRecord.complete(savedRequest.getId(), HttpStatus.CREATED.value(), objectMapper.valueToTree(response));
            idempotencyRepository.save(idempotencyRecord);
        }

        return response;
    }

    @Transactional
    public PurchaseRequestResponseDTO updateDraft(Long id, UpdatePurchaseRequestDTO dto, Long userId, String role, String requestId) {

        PurchaseRequestEntity request = requestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Solicitação não encontrada."));

        policy.requireEditPermission(request, userId);

        if (!Objects.equals(request.getLockVersion(), dto.lockVersion())) {
            throw new BusinessException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", "Registro alterado por outro usuário.");
        }

        PurchaseRequestStatus previousStatus = request.getStatus();

        request.updateDraft(request.getCostCenterId(), dto.title(), dto.description(), dto.category(), dto.neededBy());

        List<RequestItemEntity> existingItems = new ArrayList<>(request.getItems());
        existingItems.forEach(request::removeItem);

        if (dto.items() != null) {
            for (RequestItemDTO item : dto.items()) {
                request.addItem(new RequestItemEntity(item.description(), item.quantity(), item.unitPrice()));
            }
        }

        recalculateTotal(request);

        PurchaseRequestEntity updatedRequest = requestRepository.saveAndFlush(request);

        auditService.record(
                updatedRequest, userId, role != null ? role : "SOLICITANTE",
                "REQUEST_UPDATED", previousStatus, updatedRequest.getStatus(),
                updatedRequest.getCurrentVersion(), requestId, "Rascunho atualizado."
        );

        UserEntity actor = findUser(userId);
        return mapToResponse(updatedRequest, actor);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponseDTO findByIdAndUserVisibility(Long id, Long userId, String role) {

        PurchaseRequestEntity request = requestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Solicitação não encontrada."));

        UserEntity actor = findUser(userId);
        requireReadVisibility(request, actor, role);

        return mapToResponse(request, actor);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseRequestResponseDTO> listRequests(Pageable pageable, Long userId, String role) {

        UserEntity user = findUser(userId);

        Page<PurchaseRequestEntity> requests;

        if ("ADMIN".equals(role)) {
            requests = requestRepository.findAll(pageable);
        } else if ("APROVADOR".equals(role) && user.getCostCenterId() != null) {

            // Aprovadores visualizam solicitações do centro de custo,
            // mas rascunhos e ajustes privados somente quando são os donos.
            Specification<PurchaseRequestEntity> visibility = (root, query, builder) -> builder.or(
                    builder.equal(root.get("requesterId"), userId),
                    builder.and(
                            builder.equal(root.get("costCenterId"), user.getCostCenterId()),
                            root.get("status").in(
                                    PurchaseRequestStatus.PENDING_APPROVAL,
                                    PurchaseRequestStatus.APPROVED,
                                    PurchaseRequestStatus.REJECTED,
                                    PurchaseRequestStatus.CANCELLED
                            )
                    )
            );

            requests = requestRepository.findAll(visibility, pageable);
        } else {
            requests = requestRepository.findByRequesterId(userId, pageable);
        }

        return requests.map(request -> mapToResponse(request, user));
    }

    @Transactional(readOnly = true)
    public Page<PurchaseRequestResponseDTO> listApprovalInbox(
        Pageable pageable,
        Long userId
    ) {
        UserEntity actor = findUser(userId);

        if (actor.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "USER_INACTIVE",
                "Usuário inativo não pode consultar aprovações."
            );
        }

        if (actor.getRole() == UserRole.SOLICITANTE) {
            throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "ROLE_NOT_ALLOWED",
                "O perfil SOLICITANTE não possui caixa de aprovações."
            );
        }

        String approverLevel = actor.getApproverLevel() == null
            ? null
            : actor.getApproverLevel().name();

        return requestRepository.findApprovalInbox(
            actor.getId(),
            actor.getRole().name(),
            actor.getCostCenterId(),
            approverLevel,
            pageable
        ).map(request -> mapToResponse(request, actor));
    }

    private void requireReadVisibility(PurchaseRequestEntity request, UserEntity user, String role) {

        boolean isAdmin = "ADMIN".equals(role);
        boolean isOwner = Objects.equals(request.getRequesterId(), user.getId());
        boolean sameCostCenter = user.getCostCenterId() != null && Objects.equals(request.getCostCenterId(), user.getCostCenterId());
        boolean isPrivateDraft = request.getStatus() == PurchaseRequestStatus.DRAFT || request.getStatus() == PurchaseRequestStatus.CHANGES_REQUESTED;
        boolean isApprover = "APROVADOR".equals(role) && sameCostCenter && !isPrivateDraft;

        if (!isAdmin && !isOwner && !isApprover) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Solicitação não encontrada.");
        }
    }

    private Long resolveCostCenterId(UserEntity user, String role, Long dtoCostCenterId) {

        if (user.getCostCenterId() != null) {
            return user.getCostCenterId();
        }

        if ("ADMIN".equals(role)) {
            if (dtoCostCenterId == null) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "COST_CENTER_REQUIRED", "ADMIN global deve informar o centro de custo.");
            }

            return dtoCostCenterId;
        }

        throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "COST_CENTER_REQUIRED", "Usuário não possui centro de custo vinculado.");
    }

    private void recalculateTotal(PurchaseRequestEntity request) {
        List<BigDecimal> subtotals = request.getItems().stream().map(RequestItemEntity::getSubtotal).toList();
        request.updateTotal(amountCalculator.calculateTotal(subtotals));
    }

    private PurchaseRequestResponseDTO mapToResponse(PurchaseRequestEntity request, UserEntity actor) {

        List<RequestItemDTO> items = request.getItems().stream()
                .map(item -> new RequestItemDTO(item.getId(), item.getDescription(), item.getQuantity(), item.getUnitPrice(), item.getSubtotal()))
                .toList();

        ApprovalStepEntity currentStep = null;
        boolean alreadyApprovedThisVersion = false;

        if (request.getStatus() == PurchaseRequestStatus.PENDING_APPROVAL
                && request.getCurrentVersion() > 0
                && actor.getRole() != UserRole.SOLICITANTE
                && !Objects.equals(request.getRequesterId(), actor.getId())) {
            Optional<RequestVersionEntity> currentVersion = versionRepository
                .findByPurchaseRequestIdAndVersionNumber(
                    request.getId(),
                    request.getCurrentVersion()
                );

            if (currentVersion.isPresent()) {
                Long versionId = currentVersion.get().getId();
                currentStep = stepRepository
                    .findFirstByRequestVersionIdAndStatus(
                        versionId,
                        ApprovalStepStatus.PENDING
                    )
                    .orElse(null);
                alreadyApprovedThisVersion = stepRepository
                    .existsByRequestVersionIdAndApproverIdAndStatus(
                        versionId,
                        actor.getId(),
                        ApprovalStepStatus.APPROVED
                    );
            }
        }

        List<String> allowedActions = policy.calculateAllowedActions(
            request,
            actor,
            currentStep,
            alreadyApprovedThisVersion
        );

        return new PurchaseRequestResponseDTO(
                request.getId(), request.getRequesterId(), request.getCostCenterId(), request.getTitle(),
                request.getDescription(), request.getCategory(), request.getNeededBy(), request.getTotalAmount(),
                request.getStatus(), request.getCurrentVersion(), request.getLockVersion(),
                toUtc(request.getCreatedAt()), toUtc(request.getUpdatedAt()), toUtc(request.getSubmittedAt()),
                items, allowedActions
        );
    }

    private OffsetDateTime toUtc(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    private UserEntity findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND,
                "USER_NOT_FOUND",
                "Usuário não encontrado."
            ));
    }
}
