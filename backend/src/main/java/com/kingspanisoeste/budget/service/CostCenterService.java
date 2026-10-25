
package com.kingspanisoeste.budget.service;

import com.kingspanisoeste.budget.dto.CreateCostCenterDTO;
import com.kingspanisoeste.budget.dto.CostCenterResponseDTO;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CostCenterService {

    private final CostCenterRepository repository;

    public CostCenterService(CostCenterRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CostCenterResponseDTO> list() {
        return repository.findAll(Sort.by("name"))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public CostCenterResponseDTO create(
        CreateCostCenterDTO dto
    ) {
        if (dto == null ||
            dto.code() == null ||
            dto.name() == null) {
            throw invalid();
        }

        String code = dto.code()
            .trim()
            .toUpperCase(Locale.ROOT);

        String name = dto.name().trim();

        if (
            code.isBlank() ||
            code.length() > 20 ||
            name.isBlank() ||
            name.length() > 100
        ) {
            throw invalid();
        }

        if (repository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "COST_CENTER_ALREADY_EXISTS",
                "Já existe um centro de custo com esse código."
            );
        }

        CostCenterEntity entity = new CostCenterEntity(
            code,
            name,
            dto.description()
        );

        try {
            return toResponse(repository.saveAndFlush(entity));
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "COST_CENTER_CONFLICT",
                "Não foi possível cadastrar o centro de custo. Verifique se o código já existe."
            );
        }
    }

    private BusinessException invalid() {
        return new BusinessException(
            HttpStatus.UNPROCESSABLE_CONTENT,
            "INVALID_COST_CENTER",
            "Informe código e nome válidos para o centro de custo."
        );
    }

    private CostCenterResponseDTO toResponse(
        CostCenterEntity entity
    ) {
        return new CostCenterResponseDTO(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getDescription(),
            entity.getStatus().name()
        );
    }
}
