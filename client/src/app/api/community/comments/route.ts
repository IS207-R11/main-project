import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, user_id, parent_comment_id, content, image_url } = body;

    if (!post_id || !user_id || !content?.trim()) {
      return NextResponse.json({ status: 'error', message: 'Nội dung bình luận không được để trống.' }, { status: 400 });
    }

    const pool = getDbPool();

    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO community_comments (post_id, user_id, parent_comment_id, content, image_url, status)
       VALUES (?, ?, ?, ?, ?, 'PUBLISHED')`,
      [
        post_id,
        user_id,
        parent_comment_id || null,
        content.trim(),
        image_url ? JSON.stringify(image_url) : null,
      ]
    );

    return NextResponse.json({
      status: 'success',
      data: {
        id: res.insertId,
        post_id,
        user_id,
        parent_comment_id,
        content,
        image_url,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

