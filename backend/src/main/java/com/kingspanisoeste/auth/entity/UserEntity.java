
package com.kingspanisoeste.auth.entity;

import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.entity.enums.UserRole;
import com.kingspanisoeste.auth.entity.enums.UserStatus;
import com.kingspanisoeste.budget.entity.CostCenterEntity;


import jakarta.persistence.*;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;

@Entity
@Table(name = "users", schema = "public")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column (name = "name", nullable = false, length = 150)
    private String name;

    @Column (name = "email", nullable = false, length = 255)
    private String email;

    @Column (name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column (name = "role", nullable = false, length = 30)
    private  UserRole role = UserRole.SOLICITANTE;

    @Enumerated(EnumType.STRING)
    @Column (name = "approver_level", length = 20)
    private ApproverLevel approverLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn (name = "cost_center_id", referencedColumnName = "cost_center_id")
    private CostCenterEntity costCenterEntity;

    @Enumerated(EnumType.STRING)
    @Column (name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.PENDING_APPROVAL;

    @Column (name = "created_at", nullable = false, updatable = false)
    private  Instant createdAt;

    @Column (name = "updated_at", nullable = false, updatable = false)
    private  Instant updatedAt;

    //JPA

    public  UserEntity() {

    }
    //Solicitante
    public UserEntity(String name, String email, String passwordHash, CostCenterEntity costCenterEntity)
    {
        this.name = Objects.requireNonNull(name);
        this.email = Objects.requireNonNull(email)
        .trim()
        .toLowerCase(Locale.ROOT);
        this.passwordHash = Objects.requireNonNull(passwordHash);
        this.costCenterEntity = Objects.requireNonNull(costCenterEntity);
        this.role = UserRole.SOLICITANTE;
        this.status = UserStatus.PENDING_APPROVAL;
        this.approverLevel = null;
    }

    //ADMIN
    public static  UserEntity createAdmin(String name, String email,String passwordHash){
        UserEntity admin = new UserEntity();

        admin.name = Objects.requireNonNull(name).trim();
        admin.email = Objects.requireNonNull(email).trim().toLowerCase(Locale.ROOT);
         admin.passwordHash = Objects.requireNonNull(passwordHash);
         if (admin.name.isBlank() || admin.email.isBlank()) {
        throw new IllegalArgumentException(
            "Nome e email são obrigatórios."
        );
    }
        admin.role = UserRole.ADMIN;
            admin.status = UserStatus.ACTIVE;
            admin.approverLevel = null;
            admin.costCenterEntity = null;

            return admin;
        }
    

    @PrePersist 
    protected void onCreate() {
        Instant now = Instant.now();

        this.createdAt = now;
        this.updatedAt = now;

    }

    @PreUpdate 
    protected void onUpdate(){
        this.updatedAt = Instant.now();
    }

    //Metodos de dominio 
    public void registrationApprove() {
        if (this.status != UserStatus.PENDING_APPROVAL){
            throw new IllegalStateException(
                "O usuário não está agurdando aprovação"
            );
        }
        this.status = UserStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = UserStatus.INACTIVE;
    }

    public void changeName(String name){
        this.name = Objects.requireNonNull(name);
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = Objects.requireNonNull(passwordHash);
    }

    
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public ApproverLevel getApproverLevel() {
        return approverLevel;
    }

    public void setApproverLevel(ApproverLevel approverLevel) {
        this.approverLevel = approverLevel;
    }

    public CostCenterEntity getCostCenterEntity() {
        return costCenterEntity;
    }

    public void setCostCenterEntity(CostCenterEntity costCenterEntity) {
        this.costCenterEntity = costCenterEntity;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }


}