package com.kingspanisoeste.auth.service;


import java.util.List;
import java.util.Locale;

import javax.management.RuntimeErrorException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.dto.CreateUserResponseDTO;
import com.kingspanisoeste.auth.dto.LoginRequestDTO;
import com.kingspanisoeste.auth.dto.LoginResponseDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.config.JwtConfig;

import jakarta.transaction.Transactional;
@Service 

public class UserService { 
    private final UserRepository userRepository;
    private final CostCenterRepository costCenterRepository;
    private final PasswordEncoder encoder;
    private final TokenService tokenService;

      public UserService(UserRepository userRepository, PasswordEncoder encoder, CostCenterRepository costCenterRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.costCenterRepository = costCenterRepository;
        this.encoder = encoder;
        this.tokenService = tokenService;
    }   
    @Transactional 


public UserEntity create(CreateUserRequestDTO request) {


        String email = request.email()
            .trim()
            .toLowerCase(Locale.ROOT);

    if (userRepository.existsByEmailIgnoreCase(email)) {
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Email already exists"
        );
    }
    
        CostCenterEntity costCenter = costCenterRepository
            .findById(request.costCenterId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Centro de custo não encontrado"
            ));
    UserEntity user = new UserEntity(
            request.name(),
            email,
            encoder.encode(request.password()),
            costCenter
        );


    return userRepository.save(user);
}
public LoginResponseDTO login(LoginRequestDTO request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);


    
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Seu email ou sua senha não é valida"));
            
        
        if (!encoder.matches(request.password(), user.getPasswordHash())){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refaça seu login");
        }

        if (user.getStatus() != UserStatus.ACTIVE){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
            "Aguarde um administrador aprovar o seu cadastro" );
        }

    
        String token = tokenService.generateToken(user);
        
       
        CreateUserResponseDTO userDto = new CreateUserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus()
        );

        return new LoginResponseDTO(token, userDto);
    }
}