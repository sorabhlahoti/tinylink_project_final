import { pool } from '../config/database';
import { Link, CreateLinkRequest, CreateLinkResponse } from '../types';
import { generateCode } from '../utils/codeGenerator';
import { sanitizeUrl } from '../utils/urlValidator';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a new short link or reactivate an existing one
 */
export async function createLink(data: CreateLinkRequest): Promise<CreateLinkResponse> {
  const { target_url, code, owner_id } = data;
  const shortCode = code || generateCode(6);
  const sanitizedUrl = sanitizeUrl(target_url);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if code exists
    const existingLink = await client.query<Link>(
      'SELECT * FROM links WHERE code = $1',
      [shortCode]
    );

    if (existingLink.rows.length > 0) {
      const existing = existingLink.rows[0];
      
      // If inactive, reactivate it
      if (!existing.is_active) {
        const reactivated = await client.query<Link>(
          `UPDATE links 
           SET is_active = true, 
               deleted_at = NULL,
               target_url = $1,
               owner_id = COALESCE($2, owner_id)
           WHERE code = $3 
           RETURNING *`,
          [sanitizedUrl, owner_id, shortCode]
        );
        
        await client.query('COMMIT');
        
        return {
          code: reactivated.rows[0].code,
          target_url: reactivated.rows[0].target_url,
          short_url: `${baseUrl}/${reactivated.rows[0].code}`,
          created_at: reactivated.rows[0].created_at
        };
      }
      
      // If active, return 409 conflict
      await client.query('ROLLBACK');
      throw new AppError(409, 'Code already exists');
    }

    // Create new link
    const result = await client.query<Link>(
      `INSERT INTO links (code, target_url, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [shortCode, sanitizedUrl, owner_id]
    );

    await client.query('COMMIT');

    return {
      code: result.rows[0].code,
      target_url: result.rows[0].target_url,
      short_url: `${baseUrl}/${result.rows[0].code}`,
      created_at: result.rows[0].created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all active links
 */
export async function getAllLinks(): Promise<Link[]> {
  const result = await pool.query<Link>(
    'SELECT * FROM links WHERE is_active = true ORDER BY created_at DESC'
  );
  
  return result.rows;
}

/**
 * Get a single link by code
 */
export async function getLinkByCode(code: string): Promise<Link | null> {
  const result = await pool.query<Link>(
    'SELECT * FROM links WHERE code = $1 AND is_active = true',
    [code]
  );
  
  return result.rows[0] || null;
}

/**
 * Redirect to target URL and increment click counter (transactionally)
 */
export async function redirectAndTrack(
  code: string,
  referrer: string | null,
  userAgent: string | null,
  ipAddress: string | null
): Promise<string> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Lock row and get target URL
    const result = await client.query<Link>(
      `SELECT * FROM links 
       WHERE code = $1 AND is_active = true 
       FOR UPDATE`,
      [code]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError(404, 'Link not found');
    }

    const link = result.rows[0];

    // Update click statistics
    await client.query(
      `UPDATE links 
       SET total_clicks = total_clicks + 1, 
           last_clicked = now() 
       WHERE code = $1`,
      [code]
    );

    // Log click for analytics
    await client.query(
      `INSERT INTO clicks (code, referrer, user_agent, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [code, referrer, userAgent, ipAddress]
    );

    await client.query('COMMIT');

    return link.target_url;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Soft delete a link
 */
export async function deleteLink(code: string): Promise<void> {
  const result = await pool.query(
    `UPDATE links 
     SET is_active = false, deleted_at = now() 
     WHERE code = $1 AND is_active = true`,
    [code]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Link not found');
  }
}