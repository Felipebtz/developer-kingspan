package com.kingspanisoeste.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.dto.CreateUserResponseDTO;
import com.kingspanisoeste.auth.dto.LoginRequestDTO;
import com.kingspanisoeste.auth.dto.LoginResponseDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.auth.service.UserService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;


@RestController 
@RequestMapping("/auth")


public class AuthController {

    private final UserService userService;


      public AuthController(UserService userService) {
        this.userService = userService;
    }
    //login
    @PostMapping ("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request){
        LoginResponseDTO response = userService.login(request);
        return ResponseEntity.ok(response);
    }
    //registrar

    @PostMapping("/register")
    public ResponseEntity<CreateUserResponseDTO> create(@Valid @RequestBody CreateUserRequestDTO request){
        UserEntity user = userService.create(request);
        CreateUserResponseDTO response = new CreateUserResponseDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getStatus());

        return ResponseEntity 
        .status(HttpStatus.CREATED)
        .body(response);

    }

}


    
