package com.kingspanisoeste.auth.dto;

public record LoginResponseDTO( 
     String token,
     CreateUserResponseDTO user
)
{}
