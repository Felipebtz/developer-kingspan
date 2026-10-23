package com.kingspanisoeste.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import com.kingspanisoeste.auth.dto.AuthMeResponseDTO;
import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.dto.CreateUserResponseDTO;
import com.kingspanisoeste.auth.dto.LoginRequestDTO;
import com.kingspanisoeste.auth.dto.LoginResponseDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.service.UserService;

import jakarta.validation.Valid;


@RestController 
@RequestMapping("/auth")


public class AuthController {

    private final UserService userService;


      public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthMeResponseDTO> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getAutheticatedUser(jwt.getSubject()));
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


    
