package com.kingspanisoeste.auth.boostrap;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ConditionalOnProperty(
    prefix = "app.admin-bootstrap",
    name = "enabled",
    havingValue = "true"
)
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${APP_ADMIN_NAME:}")
    private String adminName;

    @Value("${APP_ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${APP_ADMIN_PASSWORD:}")
    private String adminPassword;

    public AdminBootstrap(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        if (adminName.isBlank()
                || adminEmail.isBlank()
                || adminPassword.isBlank()) {
            throw new IllegalStateException(
                "Credenciais do ADMIN inicial não configuradas."
            );
        }

        String email = adminEmail.trim()
            .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException(
                "Email do ADMIN já pertence a outro usuário."
            );
        }

        UserEntity admin = UserEntity.createAdmin(
            adminName,
            email,
            passwordEncoder.encode(adminPassword)
        );

        userRepository.save(admin);
    }
}

