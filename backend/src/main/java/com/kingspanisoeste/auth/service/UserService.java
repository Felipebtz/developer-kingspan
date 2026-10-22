package com.kingspanisoeste.auth.service;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.repository.UserRepository;

import jakarta.transaction.Transactional;
@Service 

public class UserService { 
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

      public UserService(UserRepository userRepository, PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.encoder = encoder;
    }
    @Transactional 
    public UserEntity create(CreateUserRequestDTO request ){
        if (userRepository.existsByEmail(request.email())){
            throw new RuntimeException("Esse email já existe, tente fazer login.");
        }
        UserEntity user = new UserEntity();

            user.setName(request.name());
            user.setEmail(request.email());
            user.setPasswordHash(
                encoder.encode(request.password()));
                return  userRepository.save(user);
    }
}