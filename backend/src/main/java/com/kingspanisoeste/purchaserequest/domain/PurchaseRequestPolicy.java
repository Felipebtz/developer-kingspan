package com.kingspanisoeste.purchaserequest.domain;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.shared.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PurchaseRequestPolicy {

    public boolean isOwner(PurchaseRequestEntity request, Long userId) {
        return request.getRequesterId().equals(userId);
    }

    public void requireEditPermission(PurchaseRequestEntity request, Long userId) {
        if (!isOwner(request, userId)) {
            throw new SecurityException("Apenas o solicitante original pode editar esta solicitação.");
        }
        if (!request.isEditable()) {
            throw new IllegalStateException("Esta solicitação não pode ser editada no estado atual: " + request.getStatus());
        }
    }

    public void requireSubmitPermission(PurchaseRequestEntity request, Long userId) {
        if (!isOwner(request, userId)) {
            throw new SecurityException("Apenas o solicitante original pode submeter esta solicitação.");
        }
        if (!request.isEditable()) {
            throw new IllegalStateException("Apenas solicitações em DRAFT ou CHANGES_REQUESTED podem ser submetidas.");
        }
    }

    public boolean canView(PurchaseRequestEntity request, Long userId, String userRole, Long userCostCenterId) {
        // DRAFT é absolutamente privado ao dono, mesmo que outro usuário seja ADMIN
        if (request.getStatus() == PurchaseRequestStatus.DRAFT) {
            return isOwner(request, userId);
        }

        if (isOwner(request, userId)) {
            return true;
        }

        return switch (userRole.toUpperCase()) {
            case "ADMIN" -> true;
            case "APROVADOR" -> request.getCostCenterId().equals(userCostCenterId);
            default -> false; // SOLICITANTE só vê as próprias (já validado acima)
        };
    }

    public List<String> calculateAllowedActions(
        PurchaseRequestEntity request,
        UserEntity actor,
        ApprovalStepEntity currentStep,
        boolean alreadyApprovedThisVersion
    ) {
        List<String> actions = new ArrayList<>();

        if (isOwner(request, actor.getId())) {
            if (request.getStatus() == PurchaseRequestStatus.DRAFT || request.getStatus() == PurchaseRequestStatus.CHANGES_REQUESTED) {
                actions.add("EDIT");
                actions.add("SUBMIT");
            }
            if (request.getStatus() != PurchaseRequestStatus.APPROVED 
                && request.getStatus() != PurchaseRequestStatus.REJECTED 
                && request.getStatus() != PurchaseRequestStatus.CANCELLED) {
                actions.add("CANCEL");
            }
        }

        if (canDecide(request, currentStep, actor, alreadyApprovedThisVersion)) {
            actions.add("APPROVE");
            actions.add("REJECT");
            actions.add("REQUEST_CHANGES");
        }

        return actions;
    }

    public boolean canDecide(
        PurchaseRequestEntity request,
        ApprovalStepEntity currentStep,
        UserEntity actor,
        boolean alreadyApprovedThisVersion
    ) {
        if (currentStep == null
                || actor.getStatus() != UserStatus.ACTIVE
                || actor.getRole() == UserRole.SOLICITANTE
                || request.getStatus() != PurchaseRequestStatus.PENDING_APPROVAL
                || isOwner(request, actor.getId())
                || alreadyApprovedThisVersion) {
            return false;
        }

        return isEligible(request, currentStep.getRequiredLevel(), actor);
    }

    public void requireDecisionPermission(
        PurchaseRequestEntity request,
        ApprovalStepEntity step,
        UserEntity actor,
        boolean alreadyApprovedThisVersion
    ) {
        requireDecisionAccess(request, actor);
        requireDecisionRules(
            request,
            step,
            actor,
            alreadyApprovedThisVersion
        );
    }

    public void requireDecisionAccess(
        PurchaseRequestEntity request,
        UserEntity actor
    ) {
        requireVisible(request, actor);
        requireActive(actor);

        if (actor.getRole() == UserRole.SOLICITANTE) {
            throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "ROLE_NOT_ALLOWED",
                "O perfil SOLICITANTE não pode decidir aprovações."
            );
        }
    }

    public void requireDecisionRules(
        PurchaseRequestEntity request,
        ApprovalStepEntity step,
        UserEntity actor,
        boolean alreadyApprovedThisVersion
    ) {
        if (request.getStatus() != PurchaseRequestStatus.PENDING_APPROVAL) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_TRANSITION",
                "A solicitação não está pendente de aprovação."
            );
        }

        if (isOwner(request, actor.getId())) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "SELF_APPROVAL_FORBIDDEN",
                "Não é permitido decidir a própria solicitação."
            );
        }

        if (alreadyApprovedThisVersion) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "DUPLICATE_APPROVER",
                "O mesmo usuário não pode aprovar duas etapas da versão."
            );
        }

        if (!isEligible(request, step.getRequiredLevel(), actor)) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "APPROVER_NOT_ELIGIBLE",
                "O usuário não é elegível para esta etapa."
            );
        }
    }

    public void requireCancelPermission(
        PurchaseRequestEntity request,
        UserEntity actor
    ) {
        requireCancelAccess(request, actor);
        requireCancelableState(request);
    }

    public void requireCancelAccess(
        PurchaseRequestEntity request,
        UserEntity actor
    ) {
        requireVisible(request, actor);
        requireActive(actor);

        boolean isAdmin = actor.getRole() == UserRole.ADMIN;
        if (!isAdmin && !isOwner(request, actor.getId())) {
            throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "ROLE_NOT_ALLOWED",
                "Apenas o solicitante original ou ADMIN pode cancelar."
            );
        }
    }

    public void requireCancelableState(PurchaseRequestEntity request) {
        if (request.getStatus() != PurchaseRequestStatus.DRAFT
                && request.getStatus() != PurchaseRequestStatus.PENDING_APPROVAL
                && request.getStatus() != PurchaseRequestStatus.CHANGES_REQUESTED) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_TRANSITION",
                "A solicitação não pode ser cancelada neste estado."
            );
        }
    }

    public void requireDecisionComment(String comment) {
        if (comment == null || comment.trim().length() < 10) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "COMMENT_REQUIRED",
                "Informe um comentário com pelo menos 10 caracteres."
            );
        }
    }

    private void requireVisible(
        PurchaseRequestEntity request,
        UserEntity actor
    ) {
        Long costCenterId = actor.getCostCenterId();
        if (!canView(
                request,
                actor.getId(),
                actor.getRole().name(),
                costCenterId)) {
            throw new BusinessException(
                HttpStatus.NOT_FOUND,
                "REQUEST_NOT_FOUND",
                "Solicitação não encontrada."
            );
        }
    }

    private void requireActive(UserEntity actor) {
        if (actor.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(
                HttpStatus.FORBIDDEN,
                "USER_INACTIVE",
                "Usuário inativo não pode executar esta ação."
            );
        }
    }

    private boolean isEligible(
        PurchaseRequestEntity request,
        ApprovalRequiredLevel requiredLevel,
        UserEntity actor
    ) {
        if (actor.getRole() == UserRole.ADMIN) {
            return true;
        }

        if (actor.getRole() != UserRole.APROVADOR
                || !request.getCostCenterId().equals(actor.getCostCenterId())) {
            return false;
        }

        ApproverLevel level = actor.getApproverLevel();
        return switch (requiredLevel) {
            case NIVEL_1 -> level == ApproverLevel.NIVEL_1
                || level == ApproverLevel.NIVEL_2;
            case NIVEL_2 -> level == ApproverLevel.NIVEL_2;
            case ADMIN -> false;
        };
    }
}
