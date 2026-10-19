import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, dish_id, interaction_type, allergy_ingredient_ids } = body;

    if (!user_id || !dish_id || !['FAVOURITE', 'DISLIKE', 'ALLERGY'].includes(interaction_type)) {
      return NextResponse.json({ status: 'error', message: 'Dữ liệu tương tác không hợp lệ.' }, { status: 400 });
    }

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Check if interaction already exists
      const [existing] = await conn.query<RowDataPacket[]>(
        'SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = ? AND interaction_type = ?',
        [user_id, dish_id, interaction_type]
      );

      let active = false;
      if (existing.length > 0) {
        // Toggle OFF
        await conn.query(
          'DELETE FROM user_dish_interactions WHERE user_id = ? AND dish_id = ? AND interaction_type = ?',
          [user_id, dish_id, interaction_type]
        );
        if (interaction_type === 'FAVOURITE') {
          await conn.query('UPDATE system_dishes SET favourite_count = GREATEST(0, favourite_count - 1) WHERE id = ?', [dish_id]);
        }
        active = false;
      } else {
        // Toggle ON
        await conn.query(
          'INSERT INTO user_dish_interactions (user_id, dish_id, interaction_type) VALUES (?, ?, ?)',
          [user_id, dish_id, interaction_type]
        );
        if (interaction_type === 'FAVOURITE') {
          await conn.query('UPDATE system_dishes SET favourite_count = favourite_count + 1 WHERE id = ?', [dish_id]);
        }

        // If ALLERGY with specific ingredient ids, also add to user_allergy_ingredients
        if (interaction_type === 'ALLERGY' && Array.isArray(allergy_ingredient_ids) && allergy_ingredient_ids.length > 0) {
          for (const ingId of allergy_ingredient_ids) {
            await conn.query(
              'INSERT IGNORE INTO user_allergy_ingredients (user_id, ingredient_id) VALUES (?, ?)',
              [user_id, ingId]
            );
          }
        }

        active = true;
      }

      await conn.commit();

      return NextResponse.json({
        status: 'success',
        interaction_type,
        active,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

