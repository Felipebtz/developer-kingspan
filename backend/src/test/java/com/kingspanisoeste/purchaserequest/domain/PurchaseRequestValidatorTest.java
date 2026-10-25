package com.kingspanisoeste.purchaserequest.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestItemEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

class PurchaseRequestValidatorTest {

    private PurchaseAmountCalculator amountCalculator;
    private PurchaseRequestValidator validator;

    @BeforeEach
    void setUp() {
        amountCalculator = mock(PurchaseAmountCalculator.class);
        validator = new PurchaseRequestValidator(amountCalculator);
    }

    @Test
    void naoDeveSubmeterSemTitulo() {
        PurchaseRequestEntity request = validRequest();
        lenient().when(request.getTitle()).thenReturn(" ");

        BusinessException exception = assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(request));

        assertEquals("MISSING_TITLE", exception.getCode());
        verifyNoInteractions(amountCalculator);
    }

    @Test
    void naoDeveSubmeterSemDescricaoCategoriaOuItens() {
        PurchaseRequestEntity missingDescription = validRequest();
        lenient().when(missingDescription.getDescription()).thenReturn(null);
        assertEquals("MISSING_DESCRIPTION", assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(missingDescription)).getCode());

        PurchaseRequestEntity missingCategory = validRequest();
        lenient().when(missingCategory.getCategory()).thenReturn(null);
        assertEquals("MISSING_CATEGORY", assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(missingCategory)).getCode());

        PurchaseRequestEntity missingItems = validRequest();
        lenient().when(missingItems.getItems()).thenReturn(List.of());
        assertEquals("MISSING_ITEMS", assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(missingItems)).getCode());
    }

    @Test
    void naoDeveAceitarDataPresenteQueNaoSejaFutura() {
        PurchaseRequestEntity request = validRequest();
        LocalDate today = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        lenient().when(request.getNeededBy()).thenReturn(today);

        BusinessException exception = assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(request));

        assertEquals("INVALID_NEEDED_BY", exception.getCode());
    }

    @Test
    void deveAceitarDataFuturaOuAusente() {
        PurchaseRequestEntity future = validRequest();
        lenient().when(future.getNeededBy()).thenReturn(
            LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(30));
        assertDoesNotThrow(() -> validator.validateForSubmission(future));

        PurchaseRequestEntity absent = validRequest();
        lenient().when(absent.getNeededBy()).thenReturn(null);
        assertDoesNotThrow(() -> validator.validateForSubmission(absent));
    }

    @Test
    void deveConverterInconsistenciaFinanceiraEmErroDeNegocio() {
        PurchaseRequestEntity request = validRequest();
        org.mockito.Mockito.doThrow(new IllegalStateException("divergente"))
            .when(amountCalculator)
            .validateIntegrity(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyList());

        BusinessException exception = assertThrows(BusinessException.class,
            () -> validator.validateForSubmission(request));

        assertEquals("FINANCIAL_INCONSISTENCY", exception.getCode());
    }

    private PurchaseRequestEntity validRequest() {
        PurchaseRequestEntity request = mock(PurchaseRequestEntity.class);
        RequestItemEntity item = mock(RequestItemEntity.class);
        lenient().when(request.getTitle()).thenReturn("Compra");
        lenient().when(request.getDescription()).thenReturn("Descrição");
        lenient().when(request.getCategory()).thenReturn(PurchaseCategory.EQUIPMENT);
        lenient().when(request.getCostCenterId()).thenReturn(1L);
        lenient().when(request.getNeededBy()).thenReturn(null);
        lenient().when(request.getItems()).thenReturn(List.of(item));
        lenient().when(request.getTotalAmount()).thenReturn(new BigDecimal("10.0000"));
        lenient().when(item.getSubtotal()).thenReturn(new BigDecimal("10.0000"));
        return request;
    }
}
