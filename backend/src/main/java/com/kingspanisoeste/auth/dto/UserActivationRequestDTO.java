package com.kingspanisoeste.auth.dto;

import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;


import jakarta.validation.constraints.NotNull;

public record UserActivationRequestDTO(

    @NotNull (message = "o papel do usuario é obrigatorio")
    UserRole role,

    Long costCenterId,

    ApproverLevel approverLevel

) {}
