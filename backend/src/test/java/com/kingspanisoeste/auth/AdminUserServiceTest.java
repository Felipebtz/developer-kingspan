
package com.kingspanisoeste.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
        CostCenterEntity costCenter = mock(CostCenterEntity.class);


        UserEntity user = new UserEntity(
            "Maria",
            "maria@email.com",
            "hash",
            costCenter
        );

        user.setId(10L);
        user.setStatus(UserStatus.PENDING_APPROVAL);


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
    assertNotNull(result);
    assertEquals(UserStatus.ACTIVE, result.status());
    assertEquals(UserRole.APROVADOR, result.role());
    assertEquals(
        ApproverLevel.NIVEL_1,
        result.approverLevel()
    );
    assertEquals(1L, result.costCenterId());

    verify(userRepository).save(user);
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
        user.setId(10L);
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
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

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
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
    void naoDeveAtribuirNivelParaAdmin() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.ADMIN,
            null,
            ApproverLevel.NIVEL_1
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
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

    // =========================================
    // RN02 - CENTRO DE CUSTO
    // =========================================

    @Test
    void naoDeveAtivarSolicitanteSemCentroDeCusto() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.SOLICITANTE,
            null,
            null
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
        assertEquals(
            HttpStatus.BAD_REQUEST,
            ex.getStatus()
        );

        assertEquals(
            "COST_CENTER_REQUIRED",
            ex.getCode()
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void naoDeveAtivarComCentroDeCustoInexistente() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.APROVADOR,
            99L,
            ApproverLevel.NIVEL_1
        );

        UserEntity user = new UserEntity();
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));

        when(costCenterRepository.findById(99L))
            .thenReturn(Optional.empty());

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
        assertEquals(
            HttpStatus.NOT_FOUND,
            ex.getStatus()
        );

        assertEquals(
            "COST_CENTER_NOT_FOUND",
            ex.getCode()
        );

        verify(userRepository, never()).save(any());
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

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(10L, request)
        );

        // ASSERT
        assertEquals(
            HttpStatus.UNPROCESSABLE_CONTENT,
            ex.getStatus()
        );

        assertEquals(
            "INVALID_TRANSITION",
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

        CostCenterEntity costCenter =
            mock(CostCenterEntity.class);

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

    
        assertEquals(
            UserStatus.ACTIVE,
            result.status()
        );

        assertEquals(
            UserRole.SOLICITANTE,
            result.role()
        );

        assertNull(result.approverLevel());
        assertEquals(1L, result.costCenterId());

        verify(userRepository).save(user);
    }

    // =========================================
    // USUÁRIO NÃO ENCONTRADO
    // =========================================

    @Test
    void naoDeveAtivarUsuarioInexistente() {

        // ARRANGE
        var request = new UserActivationRequestDTO(
            UserRole.SOLICITANTE,
            1L,
            null
        );

        when(userRepository.findById(99L))
            .thenReturn(Optional.empty());

        // ACT
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> adminUserService.activateUser(99L, request)
        );

        // ASSERT
        assertEquals(
            HttpStatus.NOT_FOUND,
            ex.getStatus()
        );

        assertEquals(
            "USER_NOT_FOUND",
            ex.getCode()
        );

        verify(userRepository, never()).save(any());
    }

    // =========================================
    // LISTAGEM PAGINADA
    // =========================================

    @Test
    void deveListarTodosUsuariosSemFiltro() {

        // ARRANGE
        Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findAll(pageable))
            .thenReturn(Page.empty(pageable));

        // ACT
        Page<AdminUserResponseDTO> result =
            adminUserService.listUsersByStatus(
                null,
                pageable
            );
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(userRepository).findAll(pageable);

        verify(userRepository, never())
            .findByStatus(any(), any());
    }

    @Test
    void deveListarUsuariosFiltrandoPorStatus() {

     
        Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findByStatus(
                UserStatus.PENDING_APPROVAL,
                pageable
        )).thenReturn(Page.empty(pageable));

        // ACT
        Page<AdminUserResponseDTO> result =
            adminUserService.listUsersByStatus(
                UserStatus.PENDING_APPROVAL,
                pageable
            );

        // ASSERT
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(userRepository).findByStatus(
            UserStatus.PENDING_APPROVAL,
            pageable
        );

        verify(userRepository, never()).findAll(pageable);
    }
}
