function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return [];
  } catch (error) {
    return [];
  }
}

function normalizeLegalSource(row) {
  return {
    id: row.id,
    title: row.title,
    issuingAuthority: row.issuing_authority,
    documentNumber: row.document_number,
    articleNumber: row.article_number,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    publishedDate: row.published_date,
    effectiveDate: row.effective_date,
    retrievedAt: row.retrieved_at,
    citationText: row.citation_text,
    sourceStatus: row.source_status
  };
}

function normalizeRightsGuide(row) {
  return {
    id: row.id,
    title: row.title,
    guideCode: row.guide_code,
    problemType: row.problem_type,
    riskLevel: row.risk_level,
    summary: row.summary,
    applicabilityNote: row.applicability_note,
    firstAction: row.first_action,
    evidenceItems: parseJsonArray(row.evidence_items),
    actionSteps: parseJsonArray(row.action_steps),
    officialChannels: parseJsonArray(row.official_channels),
    cautionText: row.caution_text,
    sourceReviewedAt: row.source_reviewed_at,
    reviewStatus: row.review_status,
    isEnabled: Boolean(row.is_enabled),
    updatedAt: row.updated_at
  };
}

async function databaseHealth(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM legal_sources) AS legalSourceCount,
          (SELECT COUNT(*) FROM rights_guides) AS rightsGuideCount
      `
    )
    .first();

  return jsonResponse({
    success: true,
    message: "Cloudflare D1 数据库连接正常。",
    data: {
      databaseName: "zhifamingxing-db",
      currentUser: "zhifamingxing_db",
      mysqlVersion: "Cloudflare D1 / SQLite-compatible",
      legalSourceCount: result.legalSourceCount,
      rightsGuideCount: result.rightsGuideCount
    }
  });
}

async function listLegalSources(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
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
          source_status
        FROM legal_sources
        WHERE source_status = 'current'
        ORDER BY
          published_date DESC,
          id DESC
      `
    )
    .all();

  const items = result.results.map(normalizeLegalSource);

  return jsonResponse({
    success: true,
    message: "官方依据读取成功。",
    data: {
      total: items.length,
      items
    }
  });
}

async function listRightsGuides(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
          title,
          guide_code,
          problem_type,
          risk_level,
          summary,
          applicability_note,
          first_action,
          evidence_items,
          action_steps,
          official_channels,
          caution_text,
          source_reviewed_at,
          review_status,
          is_enabled,
          updated_at
        FROM rights_guides
        WHERE
          review_status = 'reviewed'
          AND is_enabled = 1
        ORDER BY
          CASE risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          id ASC
      `
    )
    .all();

  const items = result.results.map(normalizeRightsGuide);

  return jsonResponse({
    success: true,
    message: "维权指引读取成功。",
    data: {
      total: items.length,
      items
    }
  });
}

async function getRightsGuideByCode(env, guideCode) {
  const normalizedGuideCode = decodeURIComponent(guideCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedGuideCode) {
    return jsonResponse(
      {
        success: false,
        message: "请提供维权指引编号。"
      },
      400
    );
  }

  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
          title,
          guide_code,
          problem_type,
          risk_level,
          summary,
          applicability_note,
          first_action,
          evidence_items,
          action_steps,
          official_channels,
          caution_text,
          source_reviewed_at,
          review_status,
          is_enabled,
          updated_at
        FROM rights_guides
        WHERE
          review_status = 'reviewed'
          AND is_enabled = 1
          AND guide_code = ?
        LIMIT 1
      `
    )
    .bind(normalizedGuideCode)
    .first();

  if (!result) {
    return jsonResponse(
      {
        success: false,
        message: "未找到对应的维权指引。"
      },
      404
    );
  }

  return jsonResponse({
    success: true,
    message: "维权指引读取成功。",
    data: normalizeRightsGuide(result)
  });
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return jsonResponse(
      {
        success: false,
        message: "当前接口暂不支持该请求方法。"
      },
      405
    );
  }

  if (url.pathname === "/api/health") {
    return jsonResponse({
      success: true,
      message: "智法明行 Cloudflare Worker API 运行正常。"
    });
  }

  if (url.pathname === "/api/health/database") {
    return databaseHealth(env);
  }

  if (url.pathname === "/api/legal-sources") {
    return listLegalSources(env);
  }

  if (url.pathname === "/api/rights-guides") {
    return listRightsGuides(env);
  }

  if (url.pathname.startsWith("/api/rights-guides/")) {
    const guideCode = url.pathname.replace("/api/rights-guides/", "");

    return getRightsGuideByCode(env, guideCode);
  }

  return jsonResponse(
    {
      success: false,
      message: "未找到对应接口。"
    },
    404
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: "服务暂时不可用，请稍后重试。"
        },
        500
      );
    }
  }
};
