import pool from "../config/database.js";


function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  let normalizedValue =
    value;

  if (Buffer.isBuffer(normalizedValue)) {
    normalizedValue =
      normalizedValue.toString("utf8");
  }

  if (
    typeof normalizedValue
    !==
    "string"
  ) {
    return [];
  }

  try {
    const parsedValue =
      JSON.parse(normalizedValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return [];
  } catch (error) {
    return [];
  }
}


function normalizeRightsGuide(row) {
  return {
    ...row,

    evidenceItems:
      parseJsonArray(
        row.evidenceItems
      ),

    actionSteps:
      parseJsonArray(
        row.actionSteps
      ),

    officialChannels:
      parseJsonArray(
        row.officialChannels
      ),

    isEnabled:
      Boolean(
        row.isEnabled
      )
  };
}


const rightsGuideSelectSql =
  `
    SELECT

      id,

      title,

      guide_code
        AS guideCode,

      problem_type
        AS problemType,

      risk_level
        AS riskLevel,

      summary,

      applicability_note
        AS applicabilityNote,

      first_action
        AS firstAction,

      evidence_items
        AS evidenceItems,

      action_steps
        AS actionSteps,

      official_channels
        AS officialChannels,

      caution_text
        AS cautionText,

      source_reviewed_at
        AS sourceReviewedAt,

      review_status
        AS reviewStatus,

      is_enabled
        AS isEnabled,

      updated_at
        AS updatedAt

    FROM rights_guides

    WHERE

      review_status =
      'reviewed'

      AND

      is_enabled =
      TRUE
  `;


const rightsGuideOrderSql =
  `
    ORDER BY

      CASE risk_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,

      id ASC
  `;


export async function getEnabledRightsGuides() {
  const [rows] =
    await pool.query(
      `
        ${rightsGuideSelectSql}

        ${rightsGuideOrderSql}
      `
    );


  return rows.map(
    normalizeRightsGuide
  );
}


export async function getEnabledRightsGuideByCode(
  guideCode
) {
  const [rows] =
    await pool.query(
      `
        ${rightsGuideSelectSql}

        AND

        guide_code =
        ?

        ${rightsGuideOrderSql}

        LIMIT 1
      `,

      [
        guideCode
      ]
    );


  if (
    rows.length
    ===
    0
  ) {
    return null;
  }


  return normalizeRightsGuide(
    rows[0]
  );
}
