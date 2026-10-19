import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let sql = 'SELECT * FROM community_topics';
    const params: any[] = [];

    if (search.trim()) {
      sql += ' WHERE title LIKE ? OR description LIKE ?';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY post_count DESC, id ASC';

    const [topics] = await pool.query<RowDataPacket[]>(sql, params);

    return NextResponse.json({
      status: 'success',
      data: topics,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, cover_image, created_by } = body;

    if (!title) {
      return NextResponse.json({ status: 'error', message: 'Tên chủ đề là bắt buộc.' }, { status: 400 });
    }

    const pool = getDbPool();

    // Check duplicate (fuzzy / case-insensitive)
    const normalized = title.trim().toLowerCase();
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, slug FROM community_topics WHERE LOWER(title) = ?',
      [normalized]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        status: 'duplicate',
        message: 'Chủ đề tương tự đã có sẵn trên hệ thống.',
        suggested_topic: existing[0],
      }, { status: 409 });
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO community_topics (title, slug, description, cover_image, created_by, post_count) VALUES (?, ?, ?, ?, ?, 0)',
      [title, slug, description || null, cover_image || null, created_by || null]
    );

    return NextResponse.json({
      status: 'success',
      data: { id: res.insertId, title, slug, description, cover_image, post_count: 0 },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

