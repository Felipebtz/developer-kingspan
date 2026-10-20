package com.kingspanisoeste.budget.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;
//creio que aqui será interessante criar Update AtomicoEm cenários de alta concorrência, 
// essa é uma das formas mais eficientes e seguras de garantir a integridade dos dados sem precisar usar travamentos pesados
//Então vou deixar comentado aqui para inciar essa part amanhã
//isso eu evito race condition
public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudgetEntity, Long> {
}