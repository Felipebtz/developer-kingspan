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
import com.kingspanisoeste.auth.dto.LoginRequestDTO;
import com.kingspanisoeste.auth.dto.LoginResponseDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.auth.service.TokenService;
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

    @Mock 
    private TokenService tokenService;


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
    @Test 
    void realizarLoginComSucesso(){
        var request = new LoginRequestDTO("felipe@email.com", "Senha123!");
        UserEntity user = new UserEntity("Felipe", "felipe@email.com", "hash-gerado", mock(CostCenterEntity.class));
        user.setId(1L);
        user.setStatus(UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("felipe@email.com")).thenReturn(Optional.of(user));
        when(encoder.matches("Senha123!", "hash-gerado")).thenReturn(true);
        when(tokenService.generateToken(user)).thenReturn("token-jwt-valido");

        LoginResponseDTO result = userService.login(request);

        assertNotNull(result);
        assertEquals("token-jwt-valido", result.token());
        assertEquals("felipe@email.com", result.user().email());
        assertEquals(UserStatus.ACTIVE, result.user().status());

        verify(userRepository).findByEmailIgnoreCase("felipe@email.com");
        verify(encoder).matches("Senha123!", "hash-gerado");
        verify(tokenService).generateToken(user);



    }

    @Test
    void naoDeveLogarComEmailInexistente() {
       
        var request = new LoginRequestDTO("invalido@email.com", "Senha123!");
        when(userRepository.findByEmailIgnoreCase("invalido@email.com")).thenReturn(Optional.empty());

       
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> userService.login(request));

  
        assertEquals(HttpStatus.UNAUTHORIZED.value(), exception.getStatusCode().value());
        assertEquals("Seu email ou sua senha não é valida", exception.getReason());

        
        verify(userRepository).findByEmailIgnoreCase("invalido@email.com");
        verifyNoInteractions(encoder, tokenService);
    }

    @Test
    void naoDeveLogarComSenhaIncorreta() {
     
        var request = new LoginRequestDTO("felipe@email.com", "SenhaErrada!");
        UserEntity user = new UserEntity("Felipe", "felipe@email.com", "hash-gerado", mock(CostCenterEntity.class));
        
        when(userRepository.findByEmailIgnoreCase("felipe@email.com")).thenReturn(Optional.of(user));
        when(encoder.matches("SenhaErrada!", "hash-gerado")).thenReturn(false);

    
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> userService.login(request));

    
        assertEquals(HttpStatus.UNAUTHORIZED.value(), exception.getStatusCode().value());
        assertEquals("Refaça seu login", exception.getReason());

       
        verify(userRepository).findByEmailIgnoreCase("felipe@email.com");
        verify(encoder).matches("SenhaErrada!", "hash-gerado");
        verifyNoInteractions(tokenService);
    }

    @Test
    void naoDeveLogarComUsuarioPendente() {
        
        var request = new LoginRequestDTO("felipe@email.com", "Senha123!");
        UserEntity user = new UserEntity("Felipe", "felipe@email.com", "hash-gerado", mock(CostCenterEntity.class));
        user.setStatus(UserStatus.PENDING_APPROVAL); // Status que bloqueia o login
        
        when(userRepository.findByEmailIgnoreCase("felipe@email.com")).thenReturn(Optional.of(user));
        when(encoder.matches("Senha123!", "hash-gerado")).thenReturn(true);

        
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> userService.login(request));

      
        assertEquals(HttpStatus.UNAUTHORIZED.value(), exception.getStatusCode().value());
        assertEquals("Aguarde um administrador aprovar o seu cadastro", exception.getReason());

        
        verify(userRepository).findByEmailIgnoreCase("felipe@email.com");
        verify(encoder).matches("Senha123!", "hash-gerado");
        verifyNoInteractions(tokenService);
    }
}