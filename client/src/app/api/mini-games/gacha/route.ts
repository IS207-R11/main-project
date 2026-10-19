import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      pack_type = 'random',
      dish_count,
      num,
      dietary,
      session,
      price,
    } = body;

    const pool = getDbPool();
    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    // Filter out allergic and disliked dishes
    if (user_id) {
      whereClauses.push(`
        d.id NOT IN (
          SELECT DISTINCT sdi.dish_id
          FROM system_dish_ingredients sdi
          JOIN user_allergy_ingredients uai ON sdi.ingredient_id = uai.ingredient_id
          WHERE uai.user_id = ?
        )
      `);
      params.push(user_id);

      whereClauses.push(`
        d.id NOT IN (
          SELECT udi.dish_id
          FROM user_dish_interactions udi
          WHERE udi.user_id = ? AND udi.interaction_type IN ('DISLIKE', 'ALLERGY')
        )
      `);
      params.push(user_id);
    }

    // Theme pack filters
    if (pack_type === 'breakfast') {
      whereClauses.push("(d.instructions LIKE '%15 phút%' OR d.instructions LIKE '%10 phút%' OR d.title LIKE '%sáng%')");
    } else if (pack_type === 'clean_eat') {
      whereClauses.push('d.total_calo <= 400');
    } else if (pack_type === 'family') {
      whereClauses.push("(d.instructions LIKE '%cơm%' OR d.instructions LIKE '%kho%' OR d.instructions LIKE '%canh%')");
    }

    // Dietary filter
    if (dietary === 'veg') {
      whereClauses.push("(d.title LIKE '%chay%' OR d.instructions LIKE '%chay%')");
    } else if (dietary === 'meat') {
      whereClauses.push("(d.title NOT LIKE '%chay%' AND d.instructions NOT LIKE '%món chay%')");
    }

    // Session filter
    if (session === 'breakfast' || session === 'Sáng sớm') {
      whereClauses.push("(d.instructions LIKE '%15 phút%' OR d.instructions LIKE '%10 phút%' OR d.title LIKE '%sáng%' OR d.instructions LIKE '%sáng%')");
    } else if (session === 'lunch' || session === 'Giữa trưa') {
      whereClauses.push("(d.title LIKE '%cơm%' OR d.instructions LIKE '%cơm%' OR d.title LIKE '%canh%' OR d.title LIKE '%kho%')");
    } else if (session === 'dinner' || session === 'Tối') {
      whereClauses.push("(d.title LIKE '%lẩu%' OR d.title LIKE '%nướng%' OR d.title LIKE '%hấp%' OR d.instructions LIKE '%tối%')");
    } else if (session === 'snack' || session === 'Chiều') {
      whereClauses.push("(d.title LIKE '%chè%' OR d.title LIKE '%bánh%' OR d.title LIKE '%ăn vặt%')");
    }

    // Price / Calo
    if (price === 'under_50') {
      whereClauses.push('d.total_calo <= 400');
    } else if (price === '50_80') {
      whereClauses.push('d.total_calo BETWEEN 350 AND 550');
    } else if (price === '80_120' || price === 'above_120') {
      whereClauses.push('d.total_calo >= 450');
    }

    const whereSql = whereClauses.join(' AND ');

    // Favorite weighting: Favorite dishes have higher weight
    const orderBySql = user_id
      ? `(CASE WHEN EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ${pool.escape(user_id)} AND dish_id = d.id AND interaction_type = 'FAVOURITE') THEN RAND() * 1.5 ELSE RAND() END) DESC`
      : 'RAND()';

    const cardCount = Math.max(1, Math.min(10, parseInt(dish_count || num || '3', 10)));

    let selectFields = `
      d.id, d.title, d.slug, d.image_url, d.instructions, d.total_calo, 
      d.favourite_count, d.source_url
    `;

    if (user_id) {
      selectFields += `,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'FAVOURITE') as is_favourited
      `;
    }

    const queryParams = user_id ? [user_id, ...params, cardCount] : [...params, cardCount];

    const [cards] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectFields} FROM system_dishes d WHERE ${whereSql} ORDER BY ${orderBySql} LIMIT ?`,
      queryParams
    );

    cards.forEach((d: any) => {
      try {
        d.parsed_instructions = JSON.parse(d.instructions);
      } catch {
        d.parsed_instructions = { description: d.instructions };
      }
    });

    return NextResponse.json({
      status: 'success',
      pack_type: pack_type || 'random',
      card_count: cards.length,
      data: cards,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
