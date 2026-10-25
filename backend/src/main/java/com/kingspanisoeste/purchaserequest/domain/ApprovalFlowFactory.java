package com.kingspanisoeste.purchaserequest.domain;

import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class ApprovalFlowFactory {

    private static final BigDecimal THRESHOLD_LEVEL_1 = new BigDecimal("1000.00");
    private static final BigDecimal THRESHOLD_LEVEL_2 = new BigDecimal("10000.00");

    public List<ApprovalStepEntity> generateSteps(RequestVersionEntity version) {
        List<ApprovalStepEntity> steps = new ArrayList<>();
        BigDecimal totalAmount = version.getTotalAmount();
        boolean isSoftware = version.getCategory() == PurchaseCategory.SOFTWARE;
        int stepOrder = 1;

        // Regra Padrão: Todo fluxo inicia com Nível 1
        steps.add(new ApprovalStepEntity(version.getId(), stepOrder++, ApprovalRequiredLevel.NIVEL_1, true));

        // Regra de Valor: Acima de 1.000 exige Nível 2
        if (totalAmount.compareTo(THRESHOLD_LEVEL_1) > 0) {
            steps.add(new ApprovalStepEntity(version.getId(), stepOrder++, ApprovalRequiredLevel.NIVEL_2, false));
        }

        // Regra de Valor: Acima de 10.000 exige ADMIN
        // OU Regra de Categoria: SOFTWARE sempre finaliza com ADMIN
        if (totalAmount.compareTo(THRESHOLD_LEVEL_2) > 0 || isSoftware) {
            steps.add(new ApprovalStepEntity(version.getId(), stepOrder, ApprovalRequiredLevel.ADMIN, false));
        }

        return steps;
    }
}