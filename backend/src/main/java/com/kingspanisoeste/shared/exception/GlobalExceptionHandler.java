
package com.kingspanisoeste.shared.exception;

import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> handleResponseStatus(
        ResponseStatusException ex
    ) {

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            ex.getStatusCode(),
            ex.getReason() != null
                ? ex.getReason()
                : "Não foi possível concluir a operação"
        );

        return ResponseEntity
            .status(ex.getStatusCode())
            .body(problem);
    }
}
