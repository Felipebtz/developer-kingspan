package com.kingspanisoeste.config;

import jakarta.servlet.FilterChain;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    void devePropagarRequestIdValidoParaRespostaELogs() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.HEADER_NAME, "frontend-request-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> requestIdInLog = new AtomicReference<>();
        FilterChain chain = (req, res) -> requestIdInLog.set(MDC.get("requestId"));

        filter.doFilter(request, response, chain);

        assertEquals("frontend-request-123", response.getHeader(RequestIdFilter.HEADER_NAME));
        assertEquals("frontend-request-123", requestIdInLog.get());
        assertNull(MDC.get("requestId"));
    }

    @Test
    void deveGerarRequestIdQuandoHeaderAusente() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (req, res) -> { });

        String generated = response.getHeader(RequestIdFilter.HEADER_NAME);
        assertFalse(generated == null || generated.isBlank());
        assertNull(MDC.get("requestId"));
    }
}
