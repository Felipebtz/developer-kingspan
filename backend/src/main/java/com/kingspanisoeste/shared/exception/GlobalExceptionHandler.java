package com.kingspanisoeste.shared.exception;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.OptimisticLockException;

@RestControllerAdvice

public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusinessException(BusinessException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problem.setTitle(ex.getStatus().getReasonPhrase());
        problem.setType(URI.create("https://api.kingspanisoeste.com/errors/" + ex.getCode().toLowerCase()));
        problem.setProperty("code", ex.getCode());

        return ResponseEntity.status(ex.getStatus()).body(problem);
    }

        @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Erro de validação nos dados enviados");
        problem.setTitle("Entrada Inválida");
        problem.setType(URI.create("https://api.kingspanisoeste.com/errors/invalid-input"));
        problem.setProperty("code", "INVALID_INPUT");

        List<FieldErrorDetail> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> new FieldErrorDetail(f.getField(), f.getDefaultMessage()))
            .toList();
        
        problem.setProperty("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }@ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> handleResponseStatus(ResponseStatusException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            ex.getStatusCode(),
            ex.getReason() != null ? ex.getReason() : "Não foi possível concluir a operação"
        );
        return ResponseEntity.status(ex.getStatusCode()).body(problem);
    }

    @ExceptionHandler({
        ObjectOptimisticLockingFailureException.class,
        OptimisticLockException.class,
        PessimisticLockingFailureException.class
    })
    public ResponseEntity<ProblemDetail> handleConcurrentModification(
        RuntimeException ex
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.CONFLICT,
            "A solicitação foi alterada por outra operação."
        );
        problem.setTitle(HttpStatus.CONFLICT.getReasonPhrase());
        problem.setType(URI.create(
            "https://api.kingspanisoeste.com/errors/concurrent_modification"
        ));
        problem.setProperty("code", "CONCURRENT_MODIFICATION");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    public record FieldErrorDetail(String field, String message) {}
}
