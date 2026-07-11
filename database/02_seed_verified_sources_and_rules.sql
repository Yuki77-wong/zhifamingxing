USE zhifa_mingxing;


START TRANSACTION;


/* =====================================================
   一、录入经过核验的法规、政策和官方风险提示

   说明：
   1. 所有记录保存官方原始链接；
   2. retrieved_at 保存本次录入数据库的时间；
   3. citation_text 为平台整理的适用说明，
      不冒充法规原文；
   4. INSERT IGNORE 允许脚本重复执行，
      不会重复插入相同来源。
===================================================== */


INSERT IGNORE INTO legal_sources
(
    title,

    issuing_authority,

    document_number,

    article_number,

    source_type,

    source_url,

    published_date,

    effective_date,

    retrieved_at,

    citation_text,

    content_hash,

    source_status
)
VALUES
(
    '中华人民共和国劳动合同法',

    '全国人民代表大会常务委员会',

    NULL,

    '第九条',

    'law',

    'https://fgk.chinatax.gov.cn/zcfgk/c100009/c5193025/content.html',

    '2012-12-28',

    NULL,

    NOW(),

    '第九条涉及招用劳动者时扣押居民身份证及其他证件、要求提供担保或者以其他名义收取财物等情形。平台仅在适用劳动关系可能成立时提供风险提示，不直接代替法律关系认定。',

    NULL,

    'current'
),


(
    '教育部等八部门关于印发《职业学校学生实习管理规定》的通知',

    '教育部等八部门',

    '教职成〔2021〕4号',

    NULL,

    'regulation',

    'https://www.moe.gov.cn/srcsite/A07/moe_737/s3876_qt/202201/t20220121_595529.html',

    '2022-01-21',

    NULL,

    NOW(),

    '该规定直接适用于职业学校学生实习。平台在普通高校学生或其他实习场景中仅将相关内容作为风险核实参考，不直接据此作出违法结论。',

    NULL,

    'current'
),


(
    '三部门发布求职招聘十个典型陷阱防范提示',

    '人力资源社会保障部、中央网信办、公安部',

    NULL,

    NULL,

    'official_guidance',

    'https://chrm.mohrss.gov.cn/%E4%B8%89%E9%83%A8%E9%97%A8%E5%8F%91%E5%B8%83%E6%B1%82%E8%81%8C%E6%8B%9B%E8%81%98%E5%8D%81%E4%B8%AA%E5%85%B8%E5%9E%8B%E9%99%B7%E9%98%B1%E9%98%B2%E8%8C%83%E6%8F%90%E7%A4%BA/',

    '2023-06-16',

    NULL,

    NOW(),

    '官方提示总结了招聘黑中介、入职前收费、招聘套路贷、付费培训及收费内推等典型求职风险。平台将其用于风险识别和核实建议，不将风险提示直接等同于违法认定。',

    NULL,

    'current'
);



/* =====================================================
   二、取得刚才三项官方依据的数据库编号
===================================================== */


SET @labor_contract_law_id =
(
    SELECT id

    FROM legal_sources

    WHERE source_url =
    'https://fgk.chinatax.gov.cn/zcfgk/c100009/c5193025/content.html'

    LIMIT 1
);


SET @vocational_internship_rule_id =
(
    SELECT id

    FROM legal_sources

    WHERE source_url =
    'https://www.moe.gov.cn/srcsite/A07/moe_737/s3876_qt/202201/t20220121_595529.html'

    LIMIT 1
);


SET @recruitment_warning_id =
(
    SELECT id

    FROM legal_sources

    WHERE source_url =
    'https://chrm.mohrss.gov.cn/%E4%B8%89%E9%83%A8%E9%97%A8%E5%8F%91%E5%B8%83%E6%B1%82%E8%81%8C%E6%8B%9B%E8%81%98%E5%8D%81%E4%B8%AA%E5%85%B8%E5%9E%8B%E9%99%B7%E9%98%B2%E8%8C%83%E6%8F%90%E7%A4%BA/'

    LIMIT 1
);



/* =====================================================
   三、第一批 JD 风险规则

   当前只录入证据较明确的规则。

   positive_patterns：
   可能表达风险的文本。

   negative_patterns：
   否定、免责或反向表达。

   后续算法必须同时检查正向表达和否定上下文，
   不能只按关键词直接判定。
===================================================== */


INSERT IGNORE INTO risk_rules
(
    rule_code,

    rule_name,

    risk_category,

    severity,

    rule_type,

    positive_patterns,

    negative_patterns,

    context_window,

    base_score,

    legal_source_id,

    rule_explanation,

    verification_advice,

    rule_version,

    is_enabled
)
VALUES
(
    'RECRUITMENT_UPFRONT_FEE',

    '招聘或入职前要求缴纳费用',

    '招聘收费',

    'high',

    'hybrid',

    JSON_ARRAY
    (
        '入职前缴费',

        '入职前交费',

        '先交钱',

        '先付款',

        '缴纳押金',

        '收取押金',

        '缴纳保证金',

        '收取保证金',

        '报名费',

        '工号费',

        '服装费',

        '资料费',

        '岗位稳定金',

        '设备押金',

        '任务押金'
    ),

    JSON_ARRAY
    (
        '不收取任何费用',

        '无需缴纳费用',

        '无需支付费用',

        '不需要缴费',

        '不收取押金',

        '无需缴纳押金',

        '费用由公司承担',

        '公司承担全部费用'
    ),

    50,

    82.00,

    @recruitment_warning_id,

    '岗位文本出现入职前收费、押金、保证金或其他求职前置付款要求时，应作为高风险线索进一步核实。系统必须检查附近是否存在“不收取”“无需缴纳”等否定表达，不能仅因为出现费用名称就直接判定。',

    '不要立即付款。核实收费主体、收费依据、退款规则以及招聘单位和中介机构资质，并保存岗位页面、聊天记录、付款要求和合同材料。',

    '1.0.0',

    TRUE
),


(
    'PAID_TRAINING_OR_TRAINING_LOAN',

    '招聘捆绑付费培训或培训贷款',

    '招转培与培训贷款',

    'critical',

    'hybrid',

    JSON_ARRAY
    (
        '培训贷',

        '培训贷款',

        '贷款培训',

        '办理培训贷款',

        '培训费用分期',

        '培训费分期',

        '先培训后就业',

        '付费培训后入职',

        '交培训费后上岗',

        '购买课程后入职',

        '培训后包就业',

        '培训后保就业',

        '贷款后安排工作'
    ),

    JSON_ARRAY
    (
        '免费培训',

        '培训费用由公司承担',

        '不收取培训费',

        '无需支付培训费用',

        '不办理培训贷款',

        '无需办理贷款'
    ),

    60,

    95.00,

    @recruitment_warning_id,

    '岗位招聘与高价培训、分期付款或贷款绑定时，存在招转培、培训贷款或虚假就业承诺风险。出现“培训”一词本身不代表风险，必须结合是否要求个人付费、借贷以及是否以培训作为录用前提判断。',

    '暂停签署贷款或培训协议。分别核实招聘主体、培训主体、贷款主体、实际岗位、退款条件以及就业承诺是否写入正式合同。',

    '1.0.0',

    TRUE
),


(
    'IDENTITY_DOCUMENT_RETENTION',

    '要求扣押或长期保管个人证件',

    '证件扣押',

    'critical',

    'hybrid',

    JSON_ARRAY
    (
        '扣押身份证',

        '扣留身份证',

        '身份证原件由公司保管',

        '身份证统一保管',

        '上交身份证原件',

        '身份证原件留存',

        '扣押毕业证',

        '扣留毕业证',

        '毕业证原件由公司保管',

        '扣押学生证',

        '证件原件统一保管'
    ),

    JSON_ARRAY
    (
        '仅核验身份证',

        '查验后立即归还',

        '核验后归还原件',

        '无需上交身份证原件',

        '不扣押任何证件',

        '仅提交复印件'
    ),

    50,

    98.00,

    @labor_contract_law_id,

    '要求长期扣押、扣留或统一保管身份证及其他重要证件属于严重风险线索。劳动合同法第九条适用于用人单位招用劳动者的场景；学生实习是否形成劳动关系需要结合实际用工情况判断，因此平台输出风险警示而非直接法律定性。',

    '不要交由对方长期保管证件原件。区分现场核验、提交复印件和长期扣押，并要求对方说明用途、保管期限和归还方式。',

    '1.0.0',

    TRUE
),


(
    'PAID_INTERNAL_REFERRAL',

    '收费内推或付费保证录用',

    '收费内推',

    'high',

    'hybrid',

    JSON_ARRAY
    (
        '付费内推',

        '收费内推',

        '内部推荐费',

        '内推服务费',

        '花钱内推',

        '保证拿到offer',

        '保offer',

        '付费保录用',

        '交费保入职',

        '付费直通面试'
    ),

    JSON_ARRAY
    (
        '官方员工内推',

        '不收取内推费用',

        '无需支付内推费用',

        '免费内推',

        '不保证录用'
    ),

    50,

    84.00,

    @recruitment_warning_id,

    '收费内推、付费保录用和保 offer 等承诺存在虚假宣传、收费招聘或无法兑现承诺的风险。普通员工推荐本身不等于风险，系统必须结合是否收费、是否承诺保证录用进行判断。',

    '优先通过企业官网、官方招聘账号或正规招聘平台确认岗位。不要因“内部名额”“保证录用”等承诺直接付款。',

    '1.0.0',

    TRUE
),


(
    'VOCATIONAL_INTERNSHIP_FEE_REFERENCE',

    '职业学校学生实习收费风险参考',

    '职业学校实习收费',

    'high',

    'hybrid',

    JSON_ARRAY
    (
        '实习押金',

        '实习管理费',

        '实习材料费',

        '实习服务费',

        '就业服务费',

        '实习报酬提成',

        '实习培训费'
    ),

    JSON_ARRAY
    (
        '不收取实习押金',

        '不收取实习管理费',

        '不收取实习培训费',

        '不向学生收取费用',

        '费用由学校承担',

        '费用由实习单位承担'
    ),

    60,

    86.00,

    @vocational_internship_rule_id,

    '该规则的直接政策依据适用于职业学校学生实习。系统必须先确认用户是否属于该适用范围。普通本科、高校自主实习或其他兼职场景中，只能将相关收费表达作为风险核实线索，不能机械套用该规定作出违法结论。',

    '确认学校类型、实习性质、组织主体和收费主体，并查看学校实习管理规定、实习协议及收费依据。',

    '1.0.0',

    TRUE
);


COMMIT;



/* =====================================================
   四、执行结果检查
===================================================== */


SELECT
    id,

    title,

    issuing_authority,

    source_type,

    source_status

FROM legal_sources

ORDER BY id;



SELECT
    id,

    rule_code,

    rule_name,

    severity,

    rule_type,

    base_score,

    is_enabled

FROM risk_rules

ORDER BY id;