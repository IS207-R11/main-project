import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const [posts] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, u.display_name as author_name, u.avatar_url as author_avatar, t.title as topic_title
       FROM community_posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN community_topics t ON p.topic_id = t.id
       WHERE p.id = ? AND p.status = 'PUBLISHED'`,
      [id]
    );

    if (posts.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy bài viết.' }, { status: 404 });
    }

    const post = posts[0];
    try {
      post.ingredients = typeof post.ingredients_json === 'string' ? JSON.parse(post.ingredients_json) : post.ingredients_json;
    } catch {
      post.ingredients = [];
    }
    try {
      post.steps = typeof post.steps_json === 'string' ? JSON.parse(post.steps_json) : post.steps_json;
    } catch {
      post.steps = [];
    }

    // Get comments with Cooksnap photos
    const [comments] = await pool.query<RowDataPacket[]>(
      `SELECT c.*, u.display_name as user_name, u.avatar_url as user_avatar
       FROM community_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'PUBLISHED'
       ORDER BY c.created_at ASC`,
      [id]
    );

    comments.forEach((c: any) => {
      try {
        c.photos = typeof c.image_url === 'string' ? JSON.parse(c.image_url) : c.image_url;
      } catch {
        c.photos = [];
      }
    });

    post.comments = comments;

    return NextResponse.json({
      status: 'success',
      data: post,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { user_id } = body;

    const pool = getDbPool();
    // Verify owner or admin
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT author_id FROM community_posts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy bài viết.' }, { status: 404 });
    }

    if (user_id && rows[0].author_id !== Number(user_id)) {
      return NextResponse.json({ status: 'error', message: 'Bạn không có quyền xóa bài viết này.' }, { status: 403 });
    }

    await pool.query("UPDATE community_posts SET status = 'DELETED' WHERE id = ?", [id]);

    return NextResponse.json({ status: 'success', message: 'Đã xóa bài viết thành công.' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

