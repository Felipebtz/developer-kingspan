
package com.kingspanisoeste.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.kingspanisoeste.auth.dto.AdminUserResponseDTO;
import com.kingspanisoeste.auth.dto.UserActivationRequestDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.auth.service.AdminUserService;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CostCenterRepository costCenterRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    void deveAtivarUsuarioComoAprovadorComSucesso() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.APROVADOR,
            1L,
            ApproverLevel.NIVEL_1
        );

        UserEntity user = new UserEntity(
            "Maria",
            "maria@email.com",
            "hash",
            null
        );
        user.setId(10L);
        user.setStatus(UserStatus.PENDING_APPROVAL);

        CostCenterEntity costCenter = mock(CostCenterEntity.class);

        when(costCenter.getId()).thenReturn(1L);
        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));
        when(costCenterRepository.findById(1L))
            .thenReturn(Optional.of(costCenter));
        when(userRepository.save(any(UserEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // ACT
        AdminUserResponseDTO result =
            adminUserService.activateUser(10L, request);

        // ASSERT
        assertEquals(UserStatus.ACTIVE, result.status());
        assertEquals(UserRole.APROVADOR, result.role());
        assertEquals(ApproverLevel.NIVEL_1, result.approverLevel());
        assertEquals(1L, result.costCenterId());

        verify(userRepository).save(user);
    }

    @Test
    void naoDeveAtivarUsuarioQueJaEstaAtivo() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.SOLICITANTE,
            1L,
            null
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT & ASSERT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        assertEquals(HttpStatus.UNPROCESSABLE_CONTENT, ex.getStatus());
        assertEquals("INVALID_TRANSITION", ex.getCode());

        verify(userRepository, never()).save(any());
    }

    @Test
    void naoDeveAtribuirNivelParaSolicitante() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.SOLICITANTE,
            1L,
            ApproverLevel.NIVEL_1
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT & ASSERT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        assertEquals(
            HttpStatus.UNPROCESSABLE_CONTENT,
            ex.getStatus()
        );
        assertEquals(
            "INVALID_ROLE_LEVEL_COMBINATION",
            ex.getCode()
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void naoDeveCriarAprovadorSemNivel() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.APROVADOR,
            1L,
            null
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT & ASSERT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        assertEquals(
            HttpStatus.UNPROCESSABLE_CONTENT,
            ex.getStatus()
        );
        assertEquals(
            "INVALID_ROLE_LEVEL_COMBINATION",
            ex.getCode()
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void deveReativarUsuarioInativo() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.SOLICITANTE,
            1L,
            null
        );

        UserEntity user = new UserEntity();
        user.setId(10L);
        user.setStatus(UserStatus.INACTIVE);

        CostCenterEntity costCenter = mock(CostCenterEntity.class);

        when(costCenter.getId()).thenReturn(1L);
        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));
        when(costCenterRepository.findById(1L))
            .thenReturn(Optional.of(costCenter));
        when(userRepository.save(any(UserEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // ACT
        AdminUserResponseDTO result =
            adminUserService.activateUser(10L, request);

        // ASSERT
        assertEquals(UserStatus.ACTIVE, result.status());
        assertEquals(UserRole.SOLICITANTE, result.role());
        assertNull(result.approverLevel());

        verify(userRepository).save(user);
    }
}
