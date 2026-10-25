package com.kingspanisoeste.budget.repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudgetEntity, Long> {

    Optional<MonthlyBudgetEntity> findByCostCenterIdAndCompetence(
        Long costCenterId,
        LocalDate competence
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select budget
        from MonthlyBudgetEntity budget
        where budget.costCenter.id = :costCenterId
          and budget.competence = :competence
        """)
    Optional<MonthlyBudgetEntity> findForUpdate(
        @Param("costCenterId") Long costCenterId,
        @Param("competence") LocalDate competence
    );

    @Query("""
    SELECT b
    FROM MonthlyBudgetEntity b
    JOIN FETCH b.costCenter
    ORDER BY b.competence DESC, b.id DESC
    """)
List<MonthlyBudgetEntity> findAllWithCostCenter();

@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
    SELECT b
    FROM MonthlyBudgetEntity b
    WHERE b.id = :id
    """)
Optional<MonthlyBudgetEntity> findByIdForUpdate(
    @Param("id") Long id
);
}
