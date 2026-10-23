package com.kingspanisoeste.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kingspanisoeste.auth.dto.CreateUserRequestDTO;
import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.auth.service.UserService;
import org.springframework.web.bind.annotation.RequestBody;


import org.springframework.web.bind.annotation.PostMapping;


@RestController 
@RequestMapping("/users")


public class UserController {

    private final UserService userService;


      public UserController(UserService userService) {
        this.userService = userService;
    }


    @PostMapping 
    public ResponseEntity<UserEntity> create(@RequestBody CreateUserRequestDTO request){
        UserEntity user = userService.create(request);
        return ResponseEntity.ok(user);
    }
}



    
