

CREATE TABLE public.cost_centers (
    cost_center_id BIGSERIAL PRIMARY KEY,

    cost_center_code VARCHAR(20) NOT NULL UNIQUE,
    cost_center_name VARCHAR(100) NOT NULL,
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_cost_center_status
        CHECK (
            status IN ('ACTIVE', 'INACTIVE')
        )
);


CREATE TABLE public.monthly_budgets (
    budget_id BIGSERIAL PRIMARY KEY,

    cost_center_id BIGINT NOT NULL,

    competence DATE NOT NULL,

    allocated_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    consumed_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monthly_budget_cost_center
        FOREIGN KEY (cost_center_id)
        REFERENCES public.cost_centers(cost_center_id),

    CONSTRAINT uk_monthly_budget_competence
        UNIQUE (cost_center_id, competence),

    CONSTRAINT ck_monthly_budget_values
        CHECK (
            allocated_amount >= 0
            AND consumed_amount >= 0
            AND consumed_amount <= allocated_amount
        ),

    CONSTRAINT ck_monthly_budget_competence
        CHECK (
            EXTRACT(DAY FROM competence) = 1
        )
);


CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'SOLICITANTE',

    approver_level VARCHAR(20),

    cost_center_id BIGINT,

    status VARCHAR(20) NOT NULL
        DEFAULT 'PENDING_APPROVAL',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_cost_center
        FOREIGN KEY (cost_center_id)
        REFERENCES public.cost_centers(cost_center_id),

    CONSTRAINT ck_users_role
        CHECK (
            role IN (
                'SOLICITANTE',
                'APROVADOR',
                'ADMIN'
            )
        ),

    CONSTRAINT ck_users_status
        CHECK (
            status IN (
                'PENDING_APPROVAL',
                'ACTIVE',
                'INACTIVE'
            )
        ),

    CONSTRAINT ck_users_approver_level
        CHECK (
            approver_level IS NULL
            OR approver_level IN (
                'NIVEL_1',
                'NIVEL_2'
            )
        ),

    CONSTRAINT ck_users_approver_role
        CHECK (
            (role = 'APROVADOR'
                AND approver_level IS NOT NULL)
            OR
            (role <> 'APROVADOR'
                AND approver_level IS NULL)
        ),

    CONSTRAINT ck_users_cost_center
        CHECK (
            role = 'ADMIN'
            OR cost_center_id IS NOT NULL
        )
);



CREATE UNIQUE INDEX uk_users_email_normalized
    ON public.users (LOWER(email));

CREATE INDEX idx_users_cost_center
    ON public.users (cost_center_id);
