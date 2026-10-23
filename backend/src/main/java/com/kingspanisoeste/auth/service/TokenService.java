package com.kingspanisoeste.auth.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.kingspanisoeste.auth.entity.UserEntity;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }
public String generateToken(UserEntity user) {
    Instant now = Instant.now();

    JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
        .issuer("kingspan-isoeste")
        .issuedAt(now)
        .expiresAt(now.plus(15, ChronoUnit.MINUTES))
        .subject(user.getId().toString())
        .claim("role", user.getRole().name());

    if (user.getCostCenterEntity() != null) { claimsBuilder.claim(
        "costCenterId",user.getCostCenterEntity().getId()
    );
}

    if (user.getApproverLevel() != null) {claimsBuilder.claim(
            "approverLevel",user.getApproverLevel().name()
        );
    }

    JwtClaimsSet claims = claimsBuilder.build();

    JwsHeader jwsHeader = JwsHeader
        .with(MacAlgorithm.HS256)
        .build();

    return jwtEncoder.encode(
        JwtEncoderParameters.from(jwsHeader, claims)
    ).getTokenValue();
}
}