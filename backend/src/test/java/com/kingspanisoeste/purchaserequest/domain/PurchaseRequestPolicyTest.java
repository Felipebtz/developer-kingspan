package com.kingspanisoeste.purchaserequest.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.junit.jupiter.api.Test;

class PurchaseRequestPolicyTest {

    private final PurchaseRequestPolicy policy = new PurchaseRequestPolicy();

    @Test
    void devePermitirEdicaoESubmissaoSomenteAoDonoEmEstadoEditavel() {
        PurchaseRequestEntity draft = request(10L, 20L, PurchaseRequestStatus.DRAFT);

        assertDoesNotThrow(() -> policy.requireEditPermission(draft, 10L));
        assertDoesNotThrow(() -> policy.requireSubmitPermission(draft, 10L));
        assertThrows(SecurityException.class,
            () -> policy.requireEditPermission(draft, 99L));
        assertEquals(java.util.List.of("EDIT", "SUBMIT", "CANCEL"),
            policy.calculateAllowedActions(
                draft,
                actor(10L, UserRole.SOLICITANTE, null, 20L),
                null,
                false
            ));
    }

    @Test
    void deveExporDecisoesPermitidasParaAprovadorElegivel() {
        PurchaseRequestEntity request = request(
            10L,
            20L,
            PurchaseRequestStatus.PENDING_APPROVAL
        );
        UserEntity approver = actor(
            30L,
            UserRole.APROVADOR,
            ApproverLevel.NIVEL_1,
            20L
        );

        assertEquals(
            java.util.List.of("APPROVE", "REJECT", "REQUEST_CHANGES"),
            policy.calculateAllowedActions(
                request,
                approver,
                step(ApprovalRequiredLevel.NIVEL_1),
                false
            )
        );
    }

    @Test
    void naoDeveExporDecisoesQuandoAprovadorJaAtuouNaVersao() {
        PurchaseRequestEntity request = request(
            10L,
            20L,
            PurchaseRequestStatus.PENDING_APPROVAL
        );
        UserEntity approver = actor(
            30L,
            UserRole.APROVADOR,
            ApproverLevel.NIVEL_2,
            20L
        );

        assertEquals(
            java.util.List.of(),
            policy.calculateAllowedActions(
                request,
                approver,
                step(ApprovalRequiredLevel.NIVEL_2),
                true
            )
        );
    }

    @Test
    void nivelDoisDevePoderDecidirEtapaNivelUm() {
        PurchaseRequestEntity request = request(10L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        ApprovalStepEntity step = step(ApprovalRequiredLevel.NIVEL_1);
        UserEntity actor = actor(30L, UserRole.APROVADOR, ApproverLevel.NIVEL_2, 20L);

        assertDoesNotThrow(() -> policy.requireDecisionPermission(request, step, actor, false));
    }

    @Test
    void nivelUmNaoDeveDecidirEtapaNivelDois() {
        PurchaseRequestEntity request = request(10L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        UserEntity actor = actor(30L, UserRole.APROVADOR, ApproverLevel.NIVEL_1, 20L);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> policy.requireDecisionPermission(
                request, step(ApprovalRequiredLevel.NIVEL_2), actor, false));

        assertEquals("APPROVER_NOT_ELIGIBLE", exception.getCode());
    }

    @Test
    void naoDevePermitirAutoaprovacao() {
        PurchaseRequestEntity request = request(10L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        UserEntity actor = actor(10L, UserRole.ADMIN, null, null);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> policy.requireDecisionPermission(
                request, step(ApprovalRequiredLevel.ADMIN), actor, false));

        assertEquals("SELF_APPROVAL_FORBIDDEN", exception.getCode());
    }

    @Test
    void naoDevePermitirMesmoAprovadorEmDuasEtapas() {
        PurchaseRequestEntity request = request(10L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        UserEntity actor = actor(30L, UserRole.APROVADOR, ApproverLevel.NIVEL_2, 20L);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> policy.requireDecisionPermission(
                request, step(ApprovalRequiredLevel.NIVEL_2), actor, true));

        assertEquals("DUPLICATE_APPROVER", exception.getCode());
    }

    @Test
    void aprovadorDeOutroCentroDeveReceberRecursoNaoEncontrado() {
        PurchaseRequestEntity request = request(10L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        UserEntity actor = actor(30L, UserRole.APROVADOR, ApproverLevel.NIVEL_2, 99L);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> policy.requireDecisionPermission(
                request, step(ApprovalRequiredLevel.NIVEL_1), actor, false));

        assertEquals("REQUEST_NOT_FOUND", exception.getCode());
    }

    @Test
    void solicitanteNaoDeveDecidirAprovacao() {
        PurchaseRequestEntity request = request(30L, 20L, PurchaseRequestStatus.PENDING_APPROVAL);
        UserEntity actor = actor(30L, UserRole.SOLICITANTE, null, 20L);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> policy.requireDecisionPermission(
                request, step(ApprovalRequiredLevel.NIVEL_1), actor, false));

        assertEquals("ROLE_NOT_ALLOWED", exception.getCode());
    }

    private PurchaseRequestEntity request(
        Long requesterId,
        Long costCenterId,
        PurchaseRequestStatus status
    ) {
        PurchaseRequestEntity request = mock(PurchaseRequestEntity.class);
        when(request.getRequesterId()).thenReturn(requesterId);
        when(request.getCostCenterId()).thenReturn(costCenterId);
        when(request.getStatus()).thenReturn(status);
        when(request.isEditable()).thenReturn(
            status == PurchaseRequestStatus.DRAFT
                || status == PurchaseRequestStatus.CHANGES_REQUESTED);
        return request;
    }

    private ApprovalStepEntity step(ApprovalRequiredLevel level) {
        ApprovalStepEntity step = mock(ApprovalStepEntity.class);
        when(step.getRequiredLevel()).thenReturn(level);
        return step;
    }

    private UserEntity actor(
        Long id,
        UserRole role,
        ApproverLevel level,
        Long costCenterId
    ) {
        UserEntity actor = mock(UserEntity.class);
        when(actor.getId()).thenReturn(id);
        when(actor.getRole()).thenReturn(role);
        when(actor.getApproverLevel()).thenReturn(level);
        when(actor.getCostCenterId()).thenReturn(costCenterId);
        when(actor.getStatus()).thenReturn(UserStatus.ACTIVE);
        return actor;
    }
}
