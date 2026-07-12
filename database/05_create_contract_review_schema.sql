USE zhifa_mingxing;


START TRANSACTION;


CREATE TABLE IF NOT EXISTS contract_reviews
(
    id
    BIGINT UNSIGNED
    PRIMARY KEY
    AUTO_INCREMENT,

    contract_title
    VARCHAR(300)
    NULL,

    contract_text
    LONGTEXT
    NOT NULL,

    overall_score
    DECIMAL(5,2)
    NOT NULL
    DEFAULT 0,

    overall_level
    ENUM
    (
        'low',
        'medium',
        'high',
        'critical'
    )
    NOT NULL
    DEFAULT 'low',

    confidence
    DECIMAL(5,4)
    NOT NULL
    DEFAULT 0,

    engine_version
    VARCHAR(100)
    NOT NULL,

    finding_count
    INT UNSIGNED
    NOT NULL
    DEFAULT 0,

    processing_time_ms
    INT UNSIGNED
    NOT NULL
    DEFAULT 0,

    created_at
    DATETIME
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_contract_reviews_created_at
    (
        created_at
    ),

    INDEX idx_contract_reviews_overall_level
    (
        overall_level
    )
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '合同智能审核记录表';


CREATE TABLE IF NOT EXISTS contract_rules
(
    id
    BIGINT UNSIGNED
    PRIMARY KEY
    AUTO_INCREMENT,

    rule_code
    VARCHAR(100)
    NOT NULL,

    rule_name
    VARCHAR(300)
    NOT NULL,

    risk_category
    VARCHAR(100)
    NOT NULL,

    risk_level
    ENUM
    (
        'low',
        'medium',
        'high',
        'critical'
    )
    NOT NULL,

    risk_score
    DECIMAL(5,2)
    NOT NULL
    DEFAULT 0,

    match_type
    ENUM
    (
        'exact',
        'flexible',
        'hybrid'
    )
    NOT NULL
    DEFAULT 'hybrid',

    patterns
    JSON
    NOT NULL,

    negative_patterns
    JSON
    NULL,

    reason
    TEXT
    NOT NULL,

    advice
    TEXT
    NOT NULL,

    legal_source_id
    BIGINT UNSIGNED
    NOT NULL,

    applicability_note
    TEXT
    NOT NULL,

    review_status
    ENUM
    (
        'draft',
        'reviewed',
        'disabled'
    )
    NOT NULL
    DEFAULT 'draft',

    is_enabled
    BOOLEAN
    NOT NULL
    DEFAULT TRUE,

    created_at
    DATETIME
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

    updated_at
    DATETIME
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_contract_rules_legal_source
        FOREIGN KEY
        (
            legal_source_id
        )
        REFERENCES legal_sources
        (
            id
        )
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uk_contract_rules_code
    (
        rule_code
    ),

    INDEX idx_contract_rules_review_enabled
    (
        review_status,
        is_enabled
    ),

    INDEX idx_contract_rules_risk_level
    (
        risk_level
    ),

    INDEX idx_contract_rules_legal_source
    (
        legal_source_id
    )
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '合同审核规则表';


CREATE TABLE IF NOT EXISTS contract_review_findings
(
    id
    BIGINT UNSIGNED
    PRIMARY KEY
    AUTO_INCREMENT,

    review_id
    BIGINT UNSIGNED
    NOT NULL,

    rule_id
    BIGINT UNSIGNED
    NOT NULL,

    risk_category
    VARCHAR(100)
    NOT NULL,

    risk_level
    ENUM
    (
        'low',
        'medium',
        'high',
        'critical'
    )
    NOT NULL,

    risk_score
    DECIMAL(5,2)
    NOT NULL,

    matched_text
    TEXT
    NOT NULL,

    evidence_text
    TEXT
    NOT NULL,

    reason
    TEXT
    NOT NULL,

    advice
    TEXT
    NOT NULL,

    legal_source_id
    BIGINT UNSIGNED
    NOT NULL,

    created_at
    DATETIME
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contract_findings_review
        FOREIGN KEY
        (
            review_id
        )
        REFERENCES contract_reviews
        (
            id
        )
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_contract_findings_rule
        FOREIGN KEY
        (
            rule_id
        )
        REFERENCES contract_rules
        (
            id
        )
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_contract_findings_legal_source
        FOREIGN KEY
        (
            legal_source_id
        )
        REFERENCES legal_sources
        (
            id
        )
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_contract_findings_review
    (
        review_id
    ),

    INDEX idx_contract_findings_rule
    (
        rule_id
    ),

    INDEX idx_contract_findings_category
    (
        risk_category
    ),

    INDEX idx_contract_findings_legal_source
    (
        legal_source_id
    )
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci
COMMENT = '合同审核风险发现表';


SET @labor_contract_law_id =
(
    SELECT id
    FROM legal_sources
    WHERE source_url =
    'https://fgk.chinatax.gov.cn/zcfgk/c100009/c5193025/content.html'
    LIMIT 1
);


SET @recruitment_warning_id =
(
    SELECT id
    FROM legal_sources
    WHERE source_url =
    'https://chrm.mohrss.gov.cn/%E4%B8%89%E9%83%A8%E9%97%A8%E5%8F%91%E5%B8%83%E6%B1%82%E8%81%8C%E6%8B%9B%E8%81%98%E5%8D%81%E4%B8%AA%E5%85%B8%E5%9E%8B%E9%99%B7%E9%98%B1%E9%98%B2%E8%8C%83%E6%8F%90%E7%A4%BA/'
    LIMIT 1
);


INSERT INTO contract_rules
(
    rule_code,
    rule_name,
    risk_category,
    risk_level,
    risk_score,
    match_type,
    patterns,
    negative_patterns,
    reason,
    advice,
    legal_source_id,
    applicability_note,
    review_status,
    is_enabled
)
VALUES
(
    'CONTRACT_UPFRONT_DEPOSIT_OR_GUARANTEE',
    '合同要求缴纳押金、保证金或其他入职财物',
    '入职收费与担保',
    'high',
    86.00,
    'hybrid',
    JSON_ARRAY
    (
        '缴纳押金',
        '收取押金',
        '岗位押金',
        '实习押金',
        '入职押金',
        '缴纳保证金',
        '收取保证金',
        '岗位保证金',
        '入职保证金',
        '服装费',
        '资料费',
        '工牌费',
        '设备押金'
    ),
    JSON_ARRAY
    (
        '不收取任何押金',
        '不收取押金',
        '不收取保证金',
        '无需缴纳押金',
        '无需缴纳保证金',
        '不要求提供担保',
        '不以任何名义收取财物'
    ),
    '合同中出现入职前或上岗前缴纳押金、保证金、设备押金、服装费等财物要求时，存在较高风险，需结合实际法律关系和合同内容核实。劳动合同法第九条直接适用于用人单位招用劳动者场景，实习关系是否适用需进一步判断。',
    '暂停付款并保留合同文本、聊天记录和付款要求。核实收费主体、收费名目、退还条件、学校或用人单位参与情况，必要时通过官方渠道咨询。',
    @labor_contract_law_id,
    '适用于合同、协议或补充条款中要求个人在入职、上岗、实习前支付押金、保证金或类似财物的风险提示。平台只提示风险，不直接认定条款违法或无效。',
    'reviewed',
    TRUE
),
(
    'CONTRACT_DOCUMENT_WITHHELD',
    '合同要求扣押或统一保管身份证、毕业证等证件原件',
    '证件扣押',
    'critical',
    96.00,
    'hybrid',
    JSON_ARRAY
    (
        '扣押身份证',
        '扣留身份证',
        '上交身份证原件',
        '身份证原件由公司保管',
        '身份证原件统一保管',
        '公司统一保管身份证原件',
        '扣押毕业证',
        '扣留毕业证',
        '毕业证原件由公司保管',
        '扣押学生证',
        '证件原件统一保管'
    ),
    JSON_ARRAY
    (
        '仅核验身份证',
        '核验身份证',
        '查验后立即归还',
        '核验后归还原件',
        '不扣押证件',
        '不扣押任何证件',
        '不扣押证件原件',
        '仅提交复印件'
    ),
    '合同或协议要求扣押、扣留、长期保管身份证、毕业证、学生证等证件原件时，属于严重风险线索。劳动合同法第九条对用人单位招用劳动者扣押证件作出限制；实习场景仍需结合实际用工关系和合同内容核实。',
    '不要交由对方长期保管证件原件。区分现场核验、提交复印件和长期扣押，并要求对方说明用途、保管期限和归还方式。',
    @labor_contract_law_id,
    '适用于合同文本出现证件原件交付、扣押、留存、统一保管等表达的风险提示。平台不直接判断双方是否构成劳动关系。',
    'reviewed',
    TRUE
),
(
    'CONTRACT_PAID_TRAINING_OR_LOAN',
    '合同绑定付费培训、培训贷款或培训分期',
    '付费培训与培训贷款',
    'critical',
    95.00,
    'hybrid',
    JSON_ARRAY
    (
        '付费培训',
        '缴纳培训费',
        '支付培训费',
        '培训贷款',
        '办理培训贷款',
        '培训分期',
        '培训分期贷款',
        '培训费用分期',
        '培训费分期',
        '贷款培训',
        '参加培训后需办理贷款'
    ),
    JSON_ARRAY
    (
        '免费培训',
        '培训完全免费',
        '岗前培训完全免费',
        '不收取培训费',
        '无需支付培训费',
        '不办理培训贷款',
        '无需办理培训贷款',
        '培训费用由公司承担'
    ),
    '合同将实习、入职或岗位安排与个人付费培训、培训贷款、培训分期绑定时，存在招聘陷阱或培训贷款风险。三部门招聘陷阱防范提示已将付费培训、招聘套路贷列为典型风险。',
    '暂停签署培训贷款、分期或扣款授权。分别核实招聘主体、培训主体、贷款主体、岗位真实性、退费条件以及录用承诺是否写入正式合同。',
    @recruitment_warning_id,
    '适用于合同或补充协议中将岗位机会、录用、上岗与个人付费培训、培训分期、培训贷款绑定的风险提示。单纯提到免费培训不应触发风险。',
    'reviewed',
    TRUE
),
(
    'CONTRACT_PAID_GUARANTEED_OFFER',
    '合同以收费方式承诺保录用、保就业或内部推荐',
    '收费保录用',
    'high',
    88.00,
    'hybrid',
    JSON_ARRAY
    (
        '缴费后保证录用',
        '缴费后保证安排岗位',
        '交费后保证安排岗位',
        '付费保录用',
        '收费保录用',
        '付费保证录用',
        '交费保证录用',
        '收费内部推荐',
        '付费内推',
        '内推服务费',
        '付费保就业',
        '保证拿到offer'
    ),
    JSON_ARRAY
    (
        '不保证录用',
        '不承诺录用',
        '不收取内推费用',
        '免费内推',
        '无需支付内推费用',
        '不以收费方式承诺录用'
    ),
    '合同或协议以收费方式承诺保录用、保就业、内部推荐或安排岗位时，存在较高风险。三部门招聘陷阱防范提示已提示收费内推、付费培训和虚假招聘等风险。',
    '通过企业官网、官方招聘账号或正规招聘平台核实岗位，不要因内部名额、保证录用、保就业等承诺直接付款。',
    @recruitment_warning_id,
    '适用于合同中出现个人付费换取录用、就业安排、内部推荐、offer 承诺等表达的风险提示。普通员工免费推荐本身不等于风险。',
    'reviewed',
    TRUE
)
ON DUPLICATE KEY UPDATE
    rule_name =
    VALUES(rule_name),

    risk_category =
    VALUES(risk_category),

    risk_level =
    VALUES(risk_level),

    risk_score =
    VALUES(risk_score),

    match_type =
    VALUES(match_type),

    patterns =
    VALUES(patterns),

    negative_patterns =
    VALUES(negative_patterns),

    reason =
    VALUES(reason),

    advice =
    VALUES(advice),

    legal_source_id =
    VALUES(legal_source_id),

    applicability_note =
    VALUES(applicability_note),

    review_status =
    VALUES(review_status),

    is_enabled =
    VALUES(is_enabled),

    updated_at =
    CURRENT_TIMESTAMP;


COMMIT;


SELECT
    id,
    rule_code,
    rule_name,
    risk_level,
    review_status,
    is_enabled
FROM contract_rules
ORDER BY id;
