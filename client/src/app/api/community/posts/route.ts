import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get('topic_id');
    const search = searchParams.get('search') || '';
    const exclude = searchParams.get('exclude') || ''; // Sàng lọc công thức không có
    const sort = searchParams.get('sort') || 'newest'; // newest, popular
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const whereClauses: string[] = ["p.status = 'PUBLISHED'"];
    const params: any[] = [];

    if (topicId) {
      whereClauses.push('p.topic_id = ?');
      params.push(topicId);
    }

    if (search.trim()) {
      whereClauses.push('(p.title LIKE ? OR p.story LIKE ? OR p.ingredients_json LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (exclude.trim()) {
      whereClauses.push('p.ingredients_json NOT LIKE ?');
      params.push(`%${exclude.trim()}%`);
    }

    const whereSql = whereClauses.join(' AND ');
    const orderSql = sort === 'popular'
      ? 'comment_count DESC, p.created_at DESC'
      : 'p.created_at DESC';

    const [posts] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.topic_id, p.author_id, p.title, p.story, p.servings, p.cook_time, 
              p.ingredients_json, p.steps_json, p.status, p.created_at,
              u.display_name as author_name, u.avatar_url as author_avatar,
              t.title as topic_title,
              (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id AND status = 'PUBLISHED') as comment_count,
              (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id AND status = 'PUBLISHED' AND image_url IS NOT NULL) as cooksnap_count
       FROM community_posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN community_topics t ON p.topic_id = t.id
       WHERE ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ?`,
      [...params, limit]
    );

    posts.forEach((p: any) => {
      try {
        p.ingredients = typeof p.ingredients_json === 'string' ? JSON.parse(p.ingredients_json) : p.ingredients_json;
      } catch {
        p.ingredients = [];
      }
      try {
        p.steps = typeof p.steps_json === 'string' ? JSON.parse(p.steps_json) : p.steps_json;
      } catch {
        p.steps = [];
      }
    });

    return NextResponse.json({
      status: 'success',
      data: posts,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic_id, author_id, title, story, servings, cook_time, ingredients, steps } = body;

    if (!topic_id || !author_id || !title || !ingredients || !steps) {
      return NextResponse.json({ status: 'error', message: 'Vui lòng điền đầy đủ tiêu đề, nguyên liệu và các bước nấu.' }, { status: 400 });
    }

    const pool = getDbPool();

    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO community_posts 
        (topic_id, author_id, title, story, servings, cook_time, ingredients_json, steps_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
      [
        topic_id,
        author_id,
        title,
        story || null,
        servings || 2,
        cook_time || '30 phút',
        JSON.stringify(ingredients),
        JSON.stringify(steps),
      ]
    );

    // Increment post count in topic
    await pool.query('UPDATE community_topics SET post_count = post_count + 1 WHERE id = ?', [topic_id]);

    return NextResponse.json({
      status: 'success',
      data: { id: res.insertId, title, topic_id, author_id },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

