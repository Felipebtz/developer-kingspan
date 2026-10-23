package com.kingspanisoeste.config;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date; 

import org.springframework.stereotype.Component;
import com.kingspanisoeste.auth.entity.UserEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component 
public class JwtConfig {
    
    // Corrigido hmacShaKeyFor (F maiúsculo)
    private final Key key = Keys.hmacShaKeyFor(
        "bc69bb14006ccd990289f73457d157fc00e127ca4b88eb5833111a213dcc9819".getBytes(StandardCharsets.UTF_8)
    );

    public String generateToken(UserEntity user){
        long expirationMillis = 1000 * 60 * 15;
        Date now = new Date();
        Date expiresIn = new Date(now.getTime() + expirationMillis);
        
        return Jwts.builder()
               .subject(user.getEmail())
               .issuedAt(now)
               .expiration(expiresIn)
               .signWith(key) // Corrigido de singWith para signWith
               .compact();
    }
}