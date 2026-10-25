package com.kingspanisoeste.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Request-Id";
    private static final String MDC_KEY = "requestId";
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]{1,128}");

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = normalize(request.getHeader(HEADER_NAME));
        response.setHeader(HEADER_NAME, requestId);
        MDC.put(MDC_KEY, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private String normalize(String candidate) {
        if (candidate != null && SAFE_REQUEST_ID.matcher(candidate.trim()).matches()) {
            return candidate.trim();
        }
        return UUID.randomUUID().toString();
    }
}
