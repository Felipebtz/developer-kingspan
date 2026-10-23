package com.kingspanisoeste.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.auth.service.UserService;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CostCenterRepository costCenterRepository;

    @Mock
    private PasswordEncoder encoder;

    @InjectMocks
    private UserService userService;

    @Test
    void deveCriarSolicitanteComCentroDeCusto() {
       
        var request = new CreateUserRequestDTO("Felipe", " FELIPE@EMAIL.COM ", "Senha123!", 1L);
        CostCenterEntity costCenter = mock(CostCenterEntity.class);
        when(costCenterRepository.findById(1L)).thenReturn(Optional.of(costCenter));
        when(encoder.encode("Senha123!")).thenReturn("hash-gerado");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

       
        UserEntity result = userService.create(request);
        
 
        assertNotNull(result);
        assertEquals("Felipe", result.getName());
        assertEquals("felipe@email.com", result.getEmail());
        assertEquals("hash-gerado", result.getPasswordHash());
        assertSame(costCenter, result.getCostCenterEntity());
        assertEquals(UserRole.SOLICITANTE, result.getRole());
        assertEquals(UserStatus.PENDING_APPROVAL, result.getStatus());
        assertNull(result.getApproverLevel());
        
        // VERIFY
        verify(userRepository).existsByEmailIgnoreCase("felipe@email.com");
        verify(costCenterRepository).findById(1L);
        verify(encoder).encode("Senha123!");
        verify(userRepository).save(same(result));
    }

    @Test 
    void naoCriarUsuarioEmailDuplicado() {
        
        var request = new CreateUserRequestDTO("Felipe", "felipe@email.com", "Senha", 2L);
        when(userRepository.existsByEmailIgnoreCase("felipe@email.com")).thenReturn(true);

   
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> userService.create(request));
        

        assertEquals(HttpStatus.CONFLICT.value(), exception.getStatusCode().value());
        assertEquals("Email already exists", exception.getReason());
        
       
        verify(userRepository).existsByEmailIgnoreCase("felipe@email.com");
        verify(userRepository, never()).save(any(UserEntity.class));
        verifyNoInteractions(costCenterRepository, encoder);
    }

    @Test
    void naoDeveCriarUsuarioComCentroDeCustoInexistente() {
    
        var request = new CreateUserRequestDTO("Felipe", "felipe@email.com", "Senha123!", 999L);
        when(costCenterRepository.findById(999L)).thenReturn(Optional.empty());

    
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> userService.create(request));

        
        assertEquals(HttpStatus.BAD_REQUEST.value(), exception.getStatusCode().value());
        assertEquals("Centro de custo não encontrado", exception.getReason());

    
        verify(userRepository).existsByEmailIgnoreCase("felipe@email.com");
        verify(costCenterRepository).findById(999L);
        verify(userRepository, never()).save(any(UserEntity.class));
        verifyNoInteractions(encoder);
    }
}