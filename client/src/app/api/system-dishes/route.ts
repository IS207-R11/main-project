import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const pool = getDbPool();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    // 1. Strict Allergy & Dislike Filtering
    if (userId) {
      // Exclude dishes with allergic ingredients
      whereClauses.push(`
        d.id NOT IN (
          SELECT DISTINCT sdi.dish_id
          FROM system_dish_ingredients sdi
          JOIN user_allergy_ingredients uai ON sdi.ingredient_id = uai.ingredient_id
          WHERE uai.user_id = ?
        )
      `);
      params.push(userId);

      // Exclude dishes marked DISLIKE or ALLERGY by this user
      whereClauses.push(`
        d.id NOT IN (
          SELECT udi.dish_id
          FROM user_dish_interactions udi
          WHERE udi.user_id = ? AND udi.interaction_type IN ('DISLIKE', 'ALLERGY')
        )
      `);
      params.push(userId);
    }

    // 2. Search
    if (search.trim()) {
      whereClauses.push('(d.title LIKE ? OR d.instructions LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // 3. Category / Nutrition Focus Filters
    if (category === 'giam_mo' || category === 'eat_clean') {
      whereClauses.push('d.total_calo <= 400');
    } else if (category === 'co_xuong') {
      // High protein dishes
      whereClauses.push('(d.title LIKE ? OR d.title LIKE ? OR d.instructions LIKE ?)');
      params.push('%Bò%', '%Gà%', '%protein%');
    } else if (category === 'bo_mau') {
      whereClauses.push('(d.title LIKE ? OR d.title LIKE ?)');
      params.push('%Bò%', '%Lươn%');
    } else if (category === 'tri_nao') {
      whereClauses.push('(d.title LIKE ? OR d.title LIKE ?)');
      params.push('%Cá%', '%Trứng%');
    } else if (category === 'quick') {
      whereClauses.push('d.instructions LIKE ?');
      params.push('%15 phút%');
    }

    const whereSql = whereClauses.join(' AND ');

    // Get count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM system_dishes d WHERE ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get dishes (SECURITY: never expose dislike_count or allergy_count)
    let selectFields = `
      d.id, d.title, d.slug, d.image_url, d.instructions, d.total_calo, 
      d.favourite_count, d.source_url, d.created_at, d.updated_at
    `;

    if (userId) {
      selectFields += `,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'FAVOURITE') as is_favourited,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'DISLIKE') as is_disliked,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'ALLERGY') as is_allergic
      `;
    }

    const queryParams = userId ? [userId, userId, userId, ...params, limit, offset] : [...params, limit, offset];

    const [dishes] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectFields} FROM system_dishes d WHERE ${whereSql} ORDER BY d.favourite_count DESC LIMIT ? OFFSET ?`,
      queryParams
    );

    // Fetch ingredients for these dishes
    if (dishes.length > 0) {
      const dishIds = dishes.map(d => d.id);
      const [ingredients] = await pool.query<RowDataPacket[]>(
        `SELECT sdi.dish_id, sdi.quantity_display, sdi.weight_in_grams, ni.id as ingredient_id, ni.name, ni.calo_per_100g, ni.refuse_rate
         FROM system_dish_ingredients sdi
         JOIN nutrition_ingredients ni ON sdi.ingredient_id = ni.id
         WHERE sdi.dish_id IN (?)`,
        [dishIds]
      );

      const ingredientsByDish = (ingredients as any[]).reduce((acc: any, ing: any) => {
        if (!acc[ing.dish_id]) acc[ing.dish_id] = [];
        acc[ing.dish_id].push(ing);
        return acc;
      }, {});

      dishes.forEach((d: any) => {
        try {
          d.parsed_instructions = JSON.parse(d.instructions);
        } catch {
          d.parsed_instructions = { description: d.instructions };
        }
        d.ingredients = ingredientsByDish[d.id] || [];
        if (d.ingredients.length === 0 && (d.parsed_instructions?.ingredients || d.parsed_instructions?.ingredients_gram)) {
          const raw = d.parsed_instructions.ingredients_gram || d.parsed_instructions.ingredients || [];
          d.ingredients = raw.map((ingStr: string, idx: number) => ({
            ingredient_id: idx + 1,
            name: ingStr.split(/[\t:–-]+/)[0].trim(),
            quantity_display: ingStr.match(/(\d+(?:\.\d+)?\s*(?:g|kg|lạng|quả|củ|muỗng|M|m|chén))/i)?.[0] || 'Vừa đủ',
            weight_in_grams: 50,
          }));
        }
      });
    }

    return NextResponse.json({
      status: 'success',
      total,
      data: dishes,
    });
  } catch (error: any) {
    console.error('Error fetching dishes:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, image_url, instructions, source_url, ingredients } = body;

    if (!title || !instructions || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ status: 'error', message: 'Thiếu thông tin món ăn hoặc danh sách nguyên liệu.' }, { status: 400 });
    }

    const pool = getDbPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Generate slug
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      // Pre-compute Nutrition formula: T = sum(Wi * (1 - Ri/100) * (Ni / 100))
      let totalCalo = 0.0;
      const ingredientDetails: { id: number; q: string; w: number }[] = [];

      for (const item of ingredients) {
        const [rows] = await conn.query<RowDataPacket[]>(
          'SELECT calo_per_100g, refuse_rate FROM nutrition_ingredients WHERE id = ?',
          [item.ingredient_id]
        );
        if (rows.length > 0) {
          const w = parseFloat(item.weight_in_grams) || 0;
          const r = parseFloat(rows[0].refuse_rate) / 100.0;
          const n = parseFloat(rows[0].calo_per_100g);
          const itemCalo = w * (1.0 - r) * (n / 100.0);
          totalCalo += itemCalo;

          ingredientDetails.push({
            id: item.ingredient_id,
            q: item.quantity_display || `${w}g`,
            w,
          });
        }
      }

      totalCalo = Math.round(totalCalo * 100) / 100;

      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO system_dishes (title, slug, image_url, instructions, total_calo, source_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          title,
          slug,
          image_url || null,
          typeof instructions === 'string' ? instructions : JSON.stringify(instructions),
          totalCalo,
          source_url || 'https://monngonmoingay.com/',
        ]
      );

      const dishId = res.insertId;

      for (const ing of ingredientDetails) {
        await conn.query(
          `INSERT INTO system_dish_ingredients (dish_id, ingredient_id, quantity_display, weight_in_grams)
           VALUES (?, ?, ?, ?)`,
          [dishId, ing.id, ing.q, ing.w]
        );
      }

      await conn.commit();

      return NextResponse.json({
        status: 'success',
        message: 'Tạo món ăn thành công với tính toán dinh dưỡng tự động.',
        data: { id: dishId, slug, total_calo: totalCalo },
      }, { status: 201 });
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

