import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporter_id, target_type, target_id, reason, description } = body;

    if (!reporter_id || !target_type || !target_id || !reason) {
      return NextResponse.json({ status: 'error', message: 'Vui lòng cung cấp lý do báo cáo vi phạm.' }, { status: 400 });
    }

    const pool = getDbPool();

    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, description, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [reporter_id, target_type, target_id, reason, description || null]
    );

    // Auto-hide rule: check count of distinct reporters for this target
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM moderation_reports WHERE target_type = ? AND target_id = ?',
      [target_type, target_id]
    );
    const reportCount = countRows[0]?.count || 0;

    if (reportCount >= 3) {
      if (target_type === 'POST') {
        await pool.query("UPDATE community_posts SET status = 'HIDDEN' WHERE id = ?", [target_id]);
      } else if (target_type === 'COMMENT') {
        await pool.query("UPDATE community_comments SET status = 'HIDDEN' WHERE id = ?", [target_id]);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Báo cáo vi phạm đã được gửi thành công.',
      report_id: res.insertId,
      auto_hidden: reportCount >= 3,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

