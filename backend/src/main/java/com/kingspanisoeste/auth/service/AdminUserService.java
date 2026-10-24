package com.kingspanisoeste.auth.service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kingspanisoeste.auth.dto.AdminUserResponseDTO;
import com.kingspanisoeste.auth.dto.UserActivationRequestDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

@Service 
public class AdminUserService {
    private final UserRepository userRepository;
    private final CostCenterRepository costCenterRepository;



    public AdminUserService(UserRepository userRepository, CostCenterRepository costCenterRepository){
        this.userRepository = userRepository;
        this.costCenterRepository = costCenterRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponseDTO> listUsersByStatus(UserStatus status, Pageable pageable) {
        Page<UserEntity> users = status == null ? userRepository.findAll(pageable) : userRepository.findByStatus(status, pageable);
        
        return users.map(this::mapToDTO);
    }
    @Transactional 
    public AdminUserResponseDTO activateUser(Long id, UserActivationRequestDTO request) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuário não encontrado."));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "INVALID_TRANSITION", "O usuário já está ativo.");
        }

        validateRoleAndLevel(request.role(), request.approverLevel());

        CostCenterEntity costCenter = null;
        if (request.costCenterId() == null && request.role() !=UserRole.ADMIN) {

              throw new BusinessException(HttpStatus.BAD_REQUEST, "COST_CENTER_REQUIRED", "Centro de custo é obrigatório ");
        }

        if(request.costCenterId() != null){
            costCenter = costCenterRepository.findById(request.costCenterId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "COST_CENTER_NOT_FOUND", "Centro de custo inexistente."));
        }      

            user.setRole(request.role());
            user.setApproverLevel(request.approverLevel());
            user.setCostCenterEntity(costCenter);
            user.setStatus(UserStatus.ACTIVE);

            UserEntity savedUser = userRepository.save(user);

            return mapToDTO(savedUser);
}

    private void validateRoleAndLevel(UserRole role, ApproverLevel level) {

        boolean invalid = (role == UserRole.SOLICITANTE && level != null ) || (role == UserRole.APROVADOR && level == null) || (role == UserRole.ADMIN && level != null);
        if (invalid){
            throw new BusinessException(  HttpStatus.UNPROCESSABLE_CONTENT,
            "INVALID_ROLE_LEVEL_COMBINATION",
            "Combinação inválida de papel e nível de aprovação."
        );
    }
 }

    private AdminUserResponseDTO mapToDTO(UserEntity user) {
        return new AdminUserResponseDTO(
            user.getId(), user.getName(), user.getEmail(), 
            user.getRole(), user.getStatus(), 
            user.getCostCenterEntity() != null ? user.getCostCenterEntity().getId() : null, 
            user.getApproverLevel()
        );
    }
}

