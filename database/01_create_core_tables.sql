USE zhifa_mingxing;


-- =====================================================
-- 1. 数据来源表
-- 保存公开岗位、法规、官方渠道等数据的来源信息
-- =====================================================

CREATE TABLE IF NOT EXISTS data_sources (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    source_name VARCHAR(200) NOT NULL COMMENT '数据来源名称',

    source_type ENUM(
        'government',
        'university',
        'company',
        'public_employment',
        'other'
    ) NOT NULL COMMENT '来源类型',

    base_url VARCHAR(1000) NOT NULL COMMENT '来源网站首页',

    robots_url VARCHAR(1000) NULL COMMENT 'robots.txt 地址',

    terms_url VARCHAR(1000) NULL COMMENT '网站服务条款地址',

    is_official BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT '是否属于官方来源',

    collection_status ENUM(
        'pending',
        'allowed',
        'manual_review',
        'disabled'
    ) NOT NULL DEFAULT 'pending'
        COMMENT '数据采集状态',

    last_checked_at DATETIME NULL
        COMMENT '最后一次检查来源状态的时间',

    notes TEXT NULL COMMENT '来源说明',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_source_base_url (base_url(255))
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '公开数据来源表';


-- =====================================================
-- 2. 数据采集批次表
-- 记录每一次真实数据采集任务
-- =====================================================

CREATE TABLE IF NOT EXISTS crawl_batches (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    source_id BIGINT UNSIGNED NOT NULL,

    started_at DATETIME NOT NULL,

    finished_at DATETIME NULL,

    batch_status ENUM(
        'running',
        'success',
        'partial_success',
        'failed'
    ) NOT NULL DEFAULT 'running',

    request_count INT UNSIGNED NOT NULL DEFAULT 0,

    collected_count INT UNSIGNED NOT NULL DEFAULT 0,

    new_count INT UNSIGNED NOT NULL DEFAULT 0,

    updated_count INT UNSIGNED NOT NULL DEFAULT 0,

    failed_count INT UNSIGNED NOT NULL DEFAULT 0,

    error_message TEXT NULL,

    crawler_version VARCHAR(50) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_crawl_batch_source
        FOREIGN KEY (source_id)
        REFERENCES data_sources(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '数据采集批次记录表';


-- =====================================================
-- 3. 岗位原始数据表
-- 完整保留采集到的原始公开内容
-- 不直接修改原文
-- =====================================================

CREATE TABLE IF NOT EXISTS raw_job_records (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    source_id BIGINT UNSIGNED NOT NULL,

    crawl_batch_id BIGINT UNSIGNED NULL,

    source_item_id VARCHAR(255) NULL
        COMMENT '来源网站中的岗位编号',

    source_url VARCHAR(1500) NOT NULL
        COMMENT '岗位原始页面链接',

    raw_title VARCHAR(500) NULL,

    raw_company VARCHAR(500) NULL,

    raw_location VARCHAR(500) NULL,

    raw_salary VARCHAR(500) NULL,

    raw_description LONGTEXT NULL,

    published_at DATETIME NULL,

    crawled_at DATETIME NOT NULL,

    content_hash CHAR(64) NOT NULL
        COMMENT '原始内容 SHA-256 哈希',

    raw_payload JSON NULL
        COMMENT '原始结构化响应',

    record_status ENUM(
        'new',
        'cleaned',
        'duplicate',
        'invalid',
        'archived'
    ) NOT NULL DEFAULT 'new',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_raw_job_source
        FOREIGN KEY (source_id)
        REFERENCES data_sources(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_raw_job_batch
        FOREIGN KEY (crawl_batch_id)
        REFERENCES crawl_batches(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    UNIQUE KEY uk_raw_job_content_hash (content_hash),

    INDEX idx_raw_job_source (source_id),

    INDEX idx_raw_job_crawled_at (crawled_at)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '岗位原始数据表';


-- =====================================================
-- 4. 清洗后的岗位表
-- 前台岗位中心读取本表
-- =====================================================

CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    raw_record_id BIGINT UNSIGNED NULL,

    source_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(300) NOT NULL,

    company_name VARCHAR(300) NOT NULL,

    city VARCHAR(100) NULL,

    district VARCHAR(100) NULL,

    salary_text VARCHAR(200) NULL,

    education_requirement VARCHAR(200) NULL,

    internship_duration VARCHAR(200) NULL,

    work_days_per_week DECIMAL(3,1) NULL,

    job_description LONGTEXT NOT NULL,

    job_requirements LONGTEXT NULL,

    source_url VARCHAR(1500) NOT NULL,

    source_published_at DATETIME NULL,

    first_collected_at DATETIME NOT NULL,

    last_verified_at DATETIME NULL,

    verification_status ENUM(
        'pending',
        'verified',
        'expired',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_raw_record
        FOREIGN KEY (raw_record_id)
        REFERENCES raw_job_records(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_job_source
        FOREIGN KEY (source_id)
        REFERENCES data_sources(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_job_title (title),

    INDEX idx_job_company (company_name),

    INDEX idx_job_city (city),

    INDEX idx_job_verification_status (verification_status)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '清洗后的公开岗位表';


-- =====================================================
-- 5. 法规和政策依据表
-- 所有风险规则尽量关联真实政策或法规来源
-- =====================================================

CREATE TABLE IF NOT EXISTS legal_sources (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(500) NOT NULL,

    issuing_authority VARCHAR(300) NOT NULL,

    document_number VARCHAR(200) NULL,

    article_number VARCHAR(100) NULL,

    source_type ENUM(
        'law',
        'regulation',
        'policy',
        'official_guidance',
        'official_channel'
    ) NOT NULL,

    source_url VARCHAR(1500) NOT NULL,

    published_date DATE NULL,

    effective_date DATE NULL,

    retrieved_at DATETIME NOT NULL,

    citation_text TEXT NULL,

    content_hash CHAR(64) NULL,

    source_status ENUM(
        'current',
        'revised',
        'expired',
        'pending_review'
    ) NOT NULL DEFAULT 'pending_review',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_legal_source_url (source_url(255))
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '法规政策和官方依据表';


-- =====================================================
-- 6. JD 风险规则表
-- 不把规则写死在代码中
-- =====================================================

CREATE TABLE IF NOT EXISTS risk_rules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    rule_code VARCHAR(100) NOT NULL,

    rule_name VARCHAR(300) NOT NULL,

    risk_category VARCHAR(100) NOT NULL,

    severity ENUM(
        'low',
        'medium',
        'high',
        'critical'
    ) NOT NULL,

    rule_type ENUM(
        'keyword',
        'regex',
        'context',
        'semantic',
        'hybrid'
    ) NOT NULL,

    positive_patterns JSON NULL
        COMMENT '正向风险表达',

    negative_patterns JSON NULL
        COMMENT '否定或免责表达',

    context_window INT UNSIGNED NOT NULL DEFAULT 30
        COMMENT '上下文分析字符范围',

    base_score DECIMAL(5,2) NOT NULL DEFAULT 0,

    legal_source_id BIGINT UNSIGNED NULL,

    rule_explanation TEXT NOT NULL,

    verification_advice TEXT NULL,

    rule_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',

    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_risk_rule_legal_source
        FOREIGN KEY (legal_source_id)
        REFERENCES legal_sources(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    UNIQUE KEY uk_risk_rule_code (rule_code),

    INDEX idx_risk_rule_category (risk_category),

    INDEX idx_risk_rule_enabled (is_enabled)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '岗位 JD 风险规则表';


-- =====================================================
-- 7. JD 审查记录表
-- 保存每一次用户提交的审查结果
-- =====================================================

CREATE TABLE IF NOT EXISTS jd_reviews (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    job_id BIGINT UNSIGNED NULL,

    job_title VARCHAR(300) NULL,

    company_name VARCHAR(300) NULL,

    input_text LONGTEXT NOT NULL,

    input_hash CHAR(64) NOT NULL,

    overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,

    overall_level ENUM(
        'low',
        'medium',
        'high',
        'critical',
        'insufficient_information'
    ) NOT NULL,

    confidence DECIMAL(5,4) NULL,

    engine_version VARCHAR(100) NOT NULL,

    processing_time_ms INT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jd_review_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_jd_review_created_at (created_at),

    INDEX idx_jd_review_level (overall_level)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = 'JD 审查记录表';


-- =====================================================
-- 8. JD 风险证据表
-- 每个风险结论必须尽量对应原文证据
-- =====================================================

CREATE TABLE IF NOT EXISTS jd_review_findings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    review_id BIGINT UNSIGNED NOT NULL,

    rule_id BIGINT UNSIGNED NULL,

    legal_source_id BIGINT UNSIGNED NULL,

    risk_category VARCHAR(100) NOT NULL,

    severity ENUM(
        'low',
        'medium',
        'high',
        'critical'
    ) NOT NULL,

    risk_score DECIMAL(5,2) NOT NULL,

    evidence_text TEXT NOT NULL,

    evidence_start INT UNSIGNED NULL,

    evidence_end INT UNSIGNED NULL,

    reason TEXT NOT NULL,

    verification_advice TEXT NULL,

    confidence DECIMAL(5,4) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_finding_review
        FOREIGN KEY (review_id)
        REFERENCES jd_reviews(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_finding_rule
        FOREIGN KEY (rule_id)
        REFERENCES risk_rules(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_finding_legal_source
        FOREIGN KEY (legal_source_id)
        REFERENCES legal_sources(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_finding_review (review_id),

    INDEX idx_finding_category (risk_category)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = 'JD 风险证据和分析结果表';