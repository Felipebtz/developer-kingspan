
-- Responsabilidades:
-- 1. Solicitações e itens
-- 2. Snapshots de versões
-- 3. Etapas de aprovação
-- 4. Idempotência na criação
--


CREATE TABLE purchase_requests (
    id BIGSERIAL PRIMARY KEY,

    requester_id BIGINT NOT NULL,
    cost_center_id BIGINT NOT NULL,

    title VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    needed_by DATE,

    total_amount NUMERIC(19, 4)
        NOT NULL DEFAULT 0.0000,

    status VARCHAR(50)
        NOT NULL DEFAULT 'DRAFT',

    current_version INTEGER
        NOT NULL DEFAULT 0,

    lock_version BIGINT
        NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    submitted_at TIMESTAMPTZ,

    CONSTRAINT fk_purchase_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id),

    CONSTRAINT fk_purchase_cost_center
        FOREIGN KEY (cost_center_id)
        REFERENCES cost_centers(cost_center_id),

    CONSTRAINT chk_purchase_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_purchase_version
        CHECK (current_version >= 0),

    CONSTRAINT chk_purchase_lock_version
        CHECK (lock_version >= 0),

    CONSTRAINT chk_purchase_status
        CHECK (
            status IN (
                'DRAFT',
                'PENDING_APPROVAL',
                'CHANGES_REQUESTED',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_purchase_category
        CHECK (
            category IS NULL OR
            category IN (
                'EQUIPMENT',
                'SERVICES',
                'SUPPLIES',
                'TRAVEL',
                'SOFTWARE',
                'OTHER'
            )
        )
);

CREATE INDEX idx_purchase_requester
    ON purchase_requests(requester_id);

CREATE INDEX idx_purchase_cost_center
    ON purchase_requests(cost_center_id);

CREATE INDEX idx_purchase_status_created
    ON purchase_requests(status, created_at DESC);

CREATE INDEX idx_purchase_category
    ON purchase_requests(category);

CREATE INDEX idx_purchase_created
    ON purchase_requests(created_at DESC);


CREATE TABLE request_items (
    id BIGSERIAL PRIMARY KEY,

    purchase_request_id BIGINT NOT NULL,

    description VARCHAR(255) NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price NUMERIC(19, 4) NOT NULL,

    subtotal NUMERIC(19, 4) NOT NULL,

    CONSTRAINT fk_request_items_request
        FOREIGN KEY (purchase_request_id)
        REFERENCES purchase_requests(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_item_unit_price
        CHECK (unit_price > 0),

    CONSTRAINT chk_item_subtotal
        CHECK (
            subtotal = quantity * unit_price
        ),

    CONSTRAINT chk_item_description
        CHECK (
            LENGTH(BTRIM(description)) > 0
        )
);

CREATE INDEX idx_request_items_request
    ON request_items(purchase_request_id);



CREATE TABLE request_versions (
    id BIGSERIAL PRIMARY KEY,

    purchase_request_id BIGINT NOT NULL,

    version_number INTEGER NOT NULL,

    requester_id BIGINT NOT NULL,
    cost_center_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    category VARCHAR(50) NOT NULL,

    needed_by DATE,

    total_amount NUMERIC(19, 4) NOT NULL,

    competence_date DATE NOT NULL,

    submitted_by BIGINT NOT NULL,

    submitted_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_version_request
        FOREIGN KEY (purchase_request_id)
        REFERENCES purchase_requests(id),

    CONSTRAINT fk_version_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id),

    CONSTRAINT fk_version_cost_center
        FOREIGN KEY (cost_center_id)
        REFERENCES cost_centers(cost_center_id),

    CONSTRAINT fk_version_submitter
        FOREIGN KEY (submitted_by)
        REFERENCES users(id),

    CONSTRAINT uq_request_version
        UNIQUE (
            purchase_request_id,
            version_number
        ),

    CONSTRAINT chk_version_positive
        CHECK (version_number > 0),

    CONSTRAINT chk_version_total
        CHECK (total_amount > 0),

    CONSTRAINT chk_version_competence
        CHECK (
            EXTRACT(DAY FROM competence_date) = 1
        ),

    CONSTRAINT chk_version_category
        CHECK (
            category IN (
                'EQUIPMENT',
                'SERVICES',
                'SUPPLIES',
                'TRAVEL',
                'SOFTWARE',
                'OTHER'
            )
        ),

    CONSTRAINT chk_version_title
        CHECK (LENGTH(BTRIM(title)) > 0),

    CONSTRAINT chk_version_description
        CHECK (LENGTH(BTRIM(description)) > 0)
);

CREATE INDEX idx_request_versions_request
    ON request_versions(
        purchase_request_id,
        version_number DESC
    );




CREATE TABLE request_version_items (
    id BIGSERIAL PRIMARY KEY,

    request_version_id BIGINT NOT NULL,

    description VARCHAR(255) NOT NULL,

    quantity INTEGER NOT NULL,

    unit_price NUMERIC(19, 4) NOT NULL,

    subtotal NUMERIC(19, 4) NOT NULL,

    CONSTRAINT fk_version_items_version
        FOREIGN KEY (request_version_id)
        REFERENCES request_versions(id),

    CONSTRAINT chk_version_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_version_item_price
        CHECK (unit_price > 0),

    CONSTRAINT chk_version_item_subtotal
        CHECK (
            subtotal = quantity * unit_price
        ),

    CONSTRAINT chk_version_item_description
        CHECK (LENGTH(BTRIM(description)) > 0)
);

CREATE INDEX idx_version_items_version
    ON request_version_items(request_version_id);




CREATE TABLE approval_steps (
    id BIGSERIAL PRIMARY KEY,

    request_version_id BIGINT NOT NULL,

    step_order INTEGER NOT NULL,

    required_level VARCHAR(50) NOT NULL,

    status VARCHAR(50)
        NOT NULL DEFAULT 'WAITING',

    approver_id BIGINT,

    decided_at TIMESTAMPTZ,

    CONSTRAINT fk_approval_steps_version
        FOREIGN KEY (request_version_id)
        REFERENCES request_versions(id),

    CONSTRAINT fk_approval_steps_approver
        FOREIGN KEY (approver_id)
        REFERENCES users(id),

    CONSTRAINT uq_version_step_order
        UNIQUE (
            request_version_id,
            step_order
        ),

    CONSTRAINT chk_approval_order
        CHECK (step_order > 0),

    CONSTRAINT chk_approval_level
        CHECK (
            required_level IN (
                'NIVEL_1',
                'NIVEL_2',
                'ADMIN'
            )
        ),

    CONSTRAINT chk_approval_status
        CHECK (
            status IN (
                'WAITING',
                'PENDING',
                'APPROVED',
                'REJECTED',
                'CHANGES_REQUESTED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_approval_decision
        CHECK (
            status NOT IN (
                'APPROVED',
                'REJECTED',
                'CHANGES_REQUESTED'
            )
            OR (
                approver_id IS NOT NULL
                AND decided_at IS NOT NULL
            )
        )
);

CREATE INDEX idx_approval_version
    ON approval_steps(request_version_id);

CREATE INDEX idx_approval_pending
    ON approval_steps(required_level, status)
    WHERE status = 'PENDING';

CREATE UNIQUE INDEX uq_active_approval_step
    ON approval_steps(request_version_id)
    WHERE status = 'PENDING';


CREATE UNIQUE INDEX uq_version_approved_actor
    ON approval_steps(
        request_version_id,
        approver_id
    )
    WHERE approver_id IS NOT NULL
      AND status = 'APPROVED';




CREATE TABLE request_idempotency (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    idempotency_key VARCHAR(255) NOT NULL,

    payload_hash VARCHAR(64) NOT NULL,

    purchase_request_id BIGINT,

    processing_status VARCHAR(20)
        NOT NULL DEFAULT 'PROCESSING',

    response_status INTEGER,

    response_body JSONB,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_idempotency_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_idempotency_request
        FOREIGN KEY (purchase_request_id)
        REFERENCES purchase_requests(id),

    CONSTRAINT uq_idempotency_user_key
        UNIQUE (user_id, idempotency_key),

    CONSTRAINT chk_idempotency_status
        CHECK (
            processing_status IN (
                'PROCESSING',
                'COMPLETED'
            )
        ),

    CONSTRAINT chk_idempotency_expiry
        CHECK (
            expires_at >= created_at
                + INTERVAL '24 hours'
        ),

    CONSTRAINT chk_idempotency_completed
        CHECK (
            processing_status <> 'COMPLETED'
            OR (
                purchase_request_id IS NOT NULL
                AND response_status IS NOT NULL
                AND response_body IS NOT NULL
            )
        )
);

CREATE INDEX idx_idempotency_expiration
    ON request_idempotency(expires_at);

CREATE INDEX idx_idempotency_request
    ON request_idempotency(purchase_request_id);


