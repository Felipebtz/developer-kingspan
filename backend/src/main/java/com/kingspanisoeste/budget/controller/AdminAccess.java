package com.kingspanisoeste.budget.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

final class AdminAccess {

    private AdminAccess() {}

    static void requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Autenticação obrigatória."
            );
        }

        if (!"ADMIN".equals(jwt.getClaimAsString("role"))) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Acesso permitido somente ao ADMIN."
            );
        }
    }
}