import pool from "../config/database.js";


export async function getCurrentLegalSources() {
  const [rows] = await pool.query(
    `
      SELECT

        id,

        title,

        issuing_authority
          AS issuingAuthority,

        document_number
          AS documentNumber,

        article_number
          AS articleNumber,

        source_type
          AS sourceType,

        source_url
          AS sourceUrl,

        published_date
          AS publishedDate,

        effective_date
          AS effectiveDate,

        retrieved_at
          AS retrievedAt,

        citation_text
          AS citationText,

        source_status
          AS sourceStatus

      FROM legal_sources

      WHERE

        source_status =
        'current'

      ORDER BY

        published_date DESC,

        id DESC
    `
  );


  return rows;
}