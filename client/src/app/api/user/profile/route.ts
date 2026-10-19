import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ status: 'error', message: 'User ID không hợp lệ.' }, { status: 400 });
    }

    const pool = getDbPool();

    // 1. User info
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, display_name, avatar_url, role, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    const user = userRows[0];

    // 2. Allergic ingredients
    const [allergyIngredients] = await pool.query<RowDataPacket[]>(
      `SELECT ni.id, ni.name, ni.calo_per_100g
       FROM user_allergy_ingredients uai
       JOIN nutrition_ingredients ni ON uai.ingredient_id = ni.id
       WHERE uai.user_id = ?`,
      [userId]
    );

    // 3. Favourite dishes
    const [favouriteDishes] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.title, d.slug, d.image_url, d.total_calo, d.favourite_count
       FROM user_dish_interactions udi
       JOIN system_dishes d ON udi.dish_id = d.id
       WHERE udi.user_id = ? AND udi.interaction_type = 'FAVOURITE'
       ORDER BY udi.created_at DESC`,
      [userId]
    );

    // 4. Disliked dishes (Private)
    const [dislikedDishes] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.title, d.slug, d.image_url, d.total_calo
       FROM user_dish_interactions udi
       JOIN system_dishes d ON udi.dish_id = d.id
       WHERE udi.user_id = ? AND udi.interaction_type = 'DISLIKE'
       ORDER BY udi.created_at DESC`,
      [userId]
    );

    // 5. Allergic dishes (Private)
    const [allergicDishes] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.title, d.slug, d.image_url, d.total_calo
       FROM user_dish_interactions udi
       JOIN system_dishes d ON udi.dish_id = d.id
       WHERE udi.user_id = ? AND udi.interaction_type = 'ALLERGY'
       ORDER BY udi.created_at DESC`,
      [userId]
    );

    // 6. User's authored community posts
    const [myPosts] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.title, p.servings, p.cook_time, p.status, p.created_at, t.title as topic_title
       FROM community_posts p
       LEFT JOIN community_topics t ON p.topic_id = t.id
       WHERE p.author_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      status: 'success',
      data: {
        user,
        allergies: allergyIngredients,
        favourites: favouriteDishes,
        dislikes: dislikedDishes,
        allergic_dishes: allergicDishes,
        posts: myPosts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, ingredient_id, dish_id, interaction_type } = body;

    const pool = getDbPool();

    if (action === 'TOGGLE_ALLERGY_INGREDIENT') {
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT 1 FROM user_allergy_ingredients WHERE user_id = ? AND ingredient_id = ?',
        [user_id, ingredient_id]
      );
      if (existing.length > 0) {
        await pool.query('DELETE FROM user_allergy_ingredients WHERE user_id = ? AND ingredient_id = ?', [user_id, ingredient_id]);
        return NextResponse.json({ status: 'success', action: 'REMOVED' });
      } else {
        await pool.query('INSERT INTO user_allergy_ingredients (user_id, ingredient_id) VALUES (?, ?)', [user_id, ingredient_id]);
        return NextResponse.json({ status: 'success', action: 'ADDED' });
      }
    }

    if (action === 'REMOVE_INTERACTION') {
      await pool.query(
        'DELETE FROM user_dish_interactions WHERE user_id = ? AND dish_id = ? AND interaction_type = ?',
        [user_id, dish_id, interaction_type]
      );
      if (interaction_type === 'FAVOURITE') {
        await pool.query('UPDATE system_dishes SET favourite_count = GREATEST(0, favourite_count - 1) WHERE id = ?', [dish_id]);
      }
      return NextResponse.json({ status: 'success', message: 'Đã hủy trạng thái tương tác.' });
    }

    return NextResponse.json({ status: 'error', message: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

