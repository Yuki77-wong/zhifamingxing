SET NAMES utf8mb4;

USE zhifa_mingxing;


START TRANSACTION;


/* =====================================================
   1. 招聘收费、培训贷款、收费内推

   统一关联：
   三部门发布求职招聘十个典型陷阱防范提示
===================================================== */

UPDATE risk_rules AS rule_record

INNER JOIN legal_sources AS legal_record

    ON legal_record.title =
       '三部门发布求职招聘十个典型陷阱防范提示'

SET

    rule_record.legal_source_id =
    legal_record.id

WHERE

    rule_record.rule_code IN
    (
        'RECRUITMENT_UPFRONT_FEE',

        'PAID_TRAINING_OR_TRAINING_LOAN',

        'PAID_INTERNAL_REFERRAL'
    );


/* =====================================================
   2. 扣押证件

   关联：
   中华人民共和国劳动合同法
===================================================== */

UPDATE risk_rules AS rule_record

INNER JOIN legal_sources AS legal_record

    ON legal_record.title =
       '中华人民共和国劳动合同法'

SET

    rule_record.legal_source_id =
    legal_record.id

WHERE

    rule_record.rule_code =
    'IDENTITY_DOCUMENT_RETENTION';


/* =====================================================
   3. 职业学校学生实习收费

   关联：
   职业学校学生实习管理规定
===================================================== */

UPDATE risk_rules AS rule_record

INNER JOIN legal_sources AS legal_record

    ON legal_record.title =
       '教育部等八部门关于印发《职业学校学生实习管理规定》的通知'

SET

    rule_record.legal_source_id =
    legal_record.id

WHERE

    rule_record.rule_code =
    'VOCATIONAL_INTERNSHIP_FEE_REFERENCE';


COMMIT;


/* =====================================================
   4. 验证结果

   正确结果：
   5 条规则的 legal_source_id 均不为 NULL
===================================================== */

SELECT

    rule_record.rule_code,

    rule_record.rule_name,

    rule_record.legal_source_id,

    legal_record.title
        AS legal_source_title,

    legal_record.issuing_authority,

    legal_record.source_url

FROM risk_rules AS rule_record

LEFT JOIN legal_sources AS legal_record

    ON legal_record.id =
       rule_record.legal_source_id

ORDER BY

    rule_record.id;