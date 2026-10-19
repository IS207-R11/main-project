import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const dietary = searchParams.get('dietary') || searchParams.get('diet');
    const mealSession = searchParams.get('mealSession') || searchParams.get('session');
    const price = searchParams.get('price');
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || searchParams.get('numberOfResult') || '15', 10)));

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    // Filter out allergic and disliked dishes from user profile
    if (userId) {
      whereClauses.push(`
        d.id NOT IN (
          SELECT DISTINCT sdi.dish_id
          FROM system_dish_ingredients sdi
          JOIN user_allergy_ingredients uai ON sdi.ingredient_id = uai.ingredient_id
          WHERE uai.user_id = ?
        )
      `);
      params.push(userId);

      whereClauses.push(`
        d.id NOT IN (
          SELECT udi.dish_id
          FROM user_dish_interactions udi
          WHERE udi.user_id = ? AND udi.interaction_type IN ('DISLIKE', 'ALLERGY')
        )
      `);
      params.push(userId);
    }

    // Dietary filter
    if (dietary === 'veg') {
      whereClauses.push("(d.title LIKE '%chay%' OR d.instructions LIKE '%chay%')");
    } else if (dietary === 'meat') {
      whereClauses.push("(d.title NOT LIKE '%chay%' AND d.instructions NOT LIKE '%món chay%')");
    }

    // Meal session filter
    if (mealSession === 'breakfast' || mealSession === 'Sáng sớm') {
      whereClauses.push("(d.instructions LIKE '%15 phút%' OR d.instructions LIKE '%10 phút%' OR d.title LIKE '%sáng%' OR d.instructions LIKE '%sáng%' OR d.title LIKE '%bánh mì%' OR d.title LIKE '%xôi%')");
    } else if (mealSession === 'lunch' || mealSession === 'Giữa trưa') {
      whereClauses.push("(d.title LIKE '%cơm%' OR d.instructions LIKE '%cơm%' OR d.title LIKE '%canh%' OR d.title LIKE '%kho%')");
    } else if (mealSession === 'dinner' || mealSession === 'Tối') {
      whereClauses.push("(d.title LIKE '%lẩu%' OR d.title LIKE '%nướng%' OR d.title LIKE '%hấp%' OR d.instructions LIKE '%tối%')");
    } else if (mealSession === 'snack' || mealSession === 'Chiều') {
      whereClauses.push("(d.title LIKE '%chè%' OR d.title LIKE '%bánh%' OR d.title LIKE '%ăn vặt%')");
    }

    // Price / Calo filter
    if (price === 'under_50') {
      whereClauses.push('d.total_calo <= 400');
    } else if (price === '50_80') {
      whereClauses.push('d.total_calo BETWEEN 350 AND 550');
    } else if (price === '80_120' || price === 'above_120') {
      whereClauses.push('d.total_calo >= 450');
    }

    const whereSql = whereClauses.join(' AND ');

    // Count matching dishes
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM system_dishes d WHERE ${whereSql}`,
      params
    );
    const totalMatching = countRows[0]?.total || 0;

    let selectFields = `
      d.id, d.title, d.slug, d.image_url, d.instructions, d.total_calo, 
      d.favourite_count, d.source_url
    `;

    if (userId) {
      selectFields += `,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'FAVOURITE') as is_favourited
      `;
    }

    const queryParams = userId ? [userId, ...params, limit] : [...params, limit];

    const [dishes] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectFields} FROM system_dishes d WHERE ${whereSql} ORDER BY RAND() LIMIT ?`,
      queryParams
    );

    // Parse instructions
    dishes.forEach((d: any) => {
      try {
        d.parsed_instructions = JSON.parse(d.instructions);
      } catch {
        d.parsed_instructions = { description: d.instructions };
      }
    });

    return NextResponse.json({
      status: 'success',
      total: totalMatching,
      count: dishes.length,
      data: dishes,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
