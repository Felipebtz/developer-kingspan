package com.kingspanisoeste.auth.dto;

public record LoginResponseDTO( 
    String accessToken,
    String tokenType,
    Long expiresIn
)
{}
