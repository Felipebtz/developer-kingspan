
CREATE TABLE purchase_request_audit (
    id BIGSERIAL PRIMARY KEY,

    purchase_request_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,

    previous_status VARCHAR(50),
    new_status VARCHAR(50),

    version_number INTEGER,

    step_order INTEGER,
    required_level VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    request_id_tracing VARCHAR(255),
    comments TEXT,

    CONSTRAINT fk_audit_purchase_request
        FOREIGN KEY (purchase_request_id)
        REFERENCES purchase_requests(id),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT chk_audit_version
        CHECK (
            version_number IS NULL
            OR version_number >= 0
        ),

    CONSTRAINT chk_audit_step_order
        CHECK (
            step_order IS NULL
            OR step_order > 0
        )
);

CREATE INDEX idx_audit_request_created
ON purchase_request_audit (
    purchase_request_id,
    created_at DESC,
    id DESC
);

CREATE INDEX idx_audit_request_version
ON purchase_request_audit (
    purchase_request_id,
    version_number
);

CREATE INDEX idx_audit_actor
ON purchase_request_audit(user_id);
