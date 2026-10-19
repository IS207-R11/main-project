import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();

    // Group reports by target to show list sorted by report count
    const [reports] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.description, r.status, r.created_at,
              u.display_name as reporter_name,
              CASE 
                WHEN r.target_type = 'POST' THEN (SELECT title FROM community_posts WHERE id = r.target_id)
                ELSE (SELECT content FROM community_comments WHERE id = r.target_id)
              END as target_title_preview,
              (SELECT COUNT(*) FROM moderation_reports WHERE target_type = r.target_type AND target_id = r.target_id) as total_reports_for_target
       FROM moderation_reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       WHERE r.status = 'PENDING'
       ORDER BY total_reports_for_target DESC, r.created_at DESC`
    );

    return NextResponse.json({
      status: 'success',
      data: reports,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { report_id, admin_id, action } = body; // RESOLVE, DISMISS, DELETE_TARGET, BAN_USER

    if (!report_id || !action) {
      return NextResponse.json({ status: 'error', message: 'Thiếu thông tin xử lý báo cáo.' }, { status: 400 });
    }

    const pool = getDbPool();

    // Get report target
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT target_type, target_id FROM moderation_reports WHERE id = ?',
      [report_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy báo cáo.' }, { status: 404 });
    }

    const { target_type, target_id } = rows[0];

    if (action === 'DELETE_TARGET') {
      if (target_type === 'POST') {
        await pool.query("UPDATE community_posts SET status = 'DELETED' WHERE id = ?", [target_id]);
      } else if (target_type === 'COMMENT') {
        await pool.query("UPDATE community_comments SET status = 'DELETED' WHERE id = ?", [target_id]);
      }
      await pool.query("UPDATE moderation_reports SET status = 'RESOLVED', reviewed_by = ? WHERE id = ?", [admin_id || null, report_id]);
    } else if (action === 'BAN_USER') {
      let authorId: number | null = null;
      if (target_type === 'POST') {
        const [pRows] = await pool.query<RowDataPacket[]>('SELECT author_id FROM community_posts WHERE id = ?', [target_id]);
        authorId = pRows[0]?.author_id || null;
        await pool.query("UPDATE community_posts SET status = 'DELETED' WHERE id = ?", [target_id]);
      } else if (target_type === 'COMMENT') {
        const [cRows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM community_comments WHERE id = ?', [target_id]);
        authorId = cRows[0]?.user_id || null;
        await pool.query("UPDATE community_comments SET status = 'DELETED' WHERE id = ?", [target_id]);
      }

      if (authorId) {
        await pool.query("UPDATE users SET status = 'BANNED' WHERE id = ?", [authorId]);
      }
      await pool.query("UPDATE moderation_reports SET status = 'RESOLVED', reviewed_by = ? WHERE id = ?", [admin_id || null, report_id]);
    } else if (action === 'RESOLVE') {
      await pool.query("UPDATE moderation_reports SET status = 'RESOLVED', reviewed_by = ? WHERE id = ?", [admin_id || null, report_id]);
    } else {
      await pool.query("UPDATE moderation_reports SET status = 'DISMISSED', reviewed_by = ? WHERE id = ?", [admin_id || null, report_id]);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Đã xử lý báo cáo thành công.',
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

