package com.kingspanisoeste.purchaserequest.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;

class ApprovalFlowFactoryTest {

    private final ApprovalFlowFactory factory = new ApprovalFlowFactory();

    @ParameterizedTest(name = "{0} / {1} gera {2}")
    @MethodSource("cenarios")
    void deveGerarFluxoComOrdemENivelCorretos(
        String amount,
        PurchaseCategory category,
        List<ApprovalRequiredLevel> expectedLevels
    ) {
        RequestVersionEntity version = mock(RequestVersionEntity.class);
        when(version.getId()).thenReturn(42L);
        when(version.getTotalAmount()).thenReturn(new BigDecimal(amount));
        when(version.getCategory()).thenReturn(category);

        List<ApprovalStepEntity> steps = factory.generateSteps(version);

        assertEquals(expectedLevels, steps.stream()
            .map(ApprovalStepEntity::getRequiredLevel)
            .toList());
        assertEquals(
            java.util.stream.IntStream.rangeClosed(1, steps.size()).boxed().toList(),
            steps.stream().map(ApprovalStepEntity::getStepOrder).toList()
        );
        assertEquals(ApprovalStepStatus.PENDING, steps.get(0).getStatus());
        assertEquals(
            steps.size() - 1,
            steps.stream().filter(step -> step.getStatus() == ApprovalStepStatus.WAITING).count()
        );
    }

    private static Stream<Arguments> cenarios() {
        return Stream.of(
            Arguments.of("1000.00", PurchaseCategory.EQUIPMENT,
                List.of(ApprovalRequiredLevel.NIVEL_1)),
            Arguments.of("1000.01", PurchaseCategory.EQUIPMENT,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.NIVEL_2)),
            Arguments.of("10000.00", PurchaseCategory.SERVICES,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.NIVEL_2)),
            Arguments.of("10000.01", PurchaseCategory.SUPPLIES,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.NIVEL_2, ApprovalRequiredLevel.ADMIN)),
            Arguments.of("500.00", PurchaseCategory.SOFTWARE,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.ADMIN)),
            Arguments.of("5000.00", PurchaseCategory.SOFTWARE,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.NIVEL_2, ApprovalRequiredLevel.ADMIN)),
            Arguments.of("20000.00", PurchaseCategory.SOFTWARE,
                List.of(ApprovalRequiredLevel.NIVEL_1, ApprovalRequiredLevel.NIVEL_2, ApprovalRequiredLevel.ADMIN))
        );
    }
}
