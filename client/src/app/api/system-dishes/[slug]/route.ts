import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const pool = getDbPool();

    let selectSql = `
      d.id, d.title, d.slug, d.image_url, d.instructions, d.total_calo, 
      d.favourite_count, d.source_url, d.created_at, d.updated_at
    `;

    if (userId) {
      selectSql += `,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'FAVOURITE') as is_favourited,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'DISLIKE') as is_disliked,
        EXISTS(SELECT 1 FROM user_dish_interactions WHERE user_id = ? AND dish_id = d.id AND interaction_type = 'ALLERGY') as is_allergic
      `;
    }

    const queryParams = userId ? [userId, userId, userId, slug, isNaN(Number(slug)) ? 0 : Number(slug)] : [slug, isNaN(Number(slug)) ? 0 : Number(slug)];

    const [dishes] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectSql} FROM system_dishes d WHERE d.slug = ? OR d.id = ? LIMIT 1`,
      queryParams
    );

    if (dishes.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy món ăn.' }, { status: 404 });
    }

    const dish = dishes[0];

    // Fetch ingredients
    const [ingredients] = await pool.query<RowDataPacket[]>(
      `SELECT sdi.quantity_display, sdi.weight_in_grams, ni.id as ingredient_id, ni.name, ni.calo_per_100g, ni.refuse_rate
       FROM system_dish_ingredients sdi
       JOIN nutrition_ingredients ni ON sdi.ingredient_id = ni.id
       WHERE sdi.dish_id = ?`,
      [dish.id]
    );

    dish.ingredients = ingredients;
    try {
      dish.parsed_instructions = JSON.parse(dish.instructions);
    } catch {
      dish.parsed_instructions = { description: dish.instructions };
    }

    // If ingredients table is empty for scraped dishes, parse from instructions
    if (!dish.ingredients || dish.ingredients.length === 0) {
      const rawList = dish.parsed_instructions?.ingredients_gram || dish.parsed_instructions?.ingredients || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        let computedTotalCalo = 0;
        dish.ingredients = rawList.map((item: string, idx: number) => {
          const cleaned = item.replace(/[\t\r\n]+/g, ' - ').trim();
          const gramMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|kg|lạng)/i);
          let weight = 50;
          let quantityDisplay = '';

          if (gramMatch) {
            const val = parseFloat(gramMatch[1]);
            if (/kg/i.test(gramMatch[0])) {
              weight = val * 1000;
              quantityDisplay = `${val}kg`;
            } else {
              weight = val;
              quantityDisplay = `${val}g`;
            }
          } else {
            const unitMatch = cleaned.match(/(\d+(?:\/\d+)?)\s*(?:quả|củ|trái|muỗng|M|m|chén|cái|nhánh|cọng|tép|lát)/i);
            if (unitMatch) {
              quantityDisplay = unitMatch[0];
              weight = 30;
            } else {
              quantityDisplay = 'Vừa đủ';
              weight = 15;
            }
          }

          let name = cleaned.split(/[\t:–-]+/)[0].trim();
          if (!name || name.length > 50) name = cleaned.slice(0, 40).trim();

          const lower = name.toLowerCase();
          let caloPer100g = 110;
          let refuseRate = 5;

          if (lower.includes('sườn') || lower.includes('heo') || lower.includes('lợn') || lower.includes('ba rọi')) {
            caloPer100g = 260;
            refuseRate = 15;
          } else if (lower.includes('bò')) {
            caloPer100g = 180;
            refuseRate = 5;
          } else if (lower.includes('gà') || lower.includes('vịt')) {
            caloPer100g = 165;
            refuseRate = 12;
          } else if (lower.includes('cá') || lower.includes('tôm') || lower.includes('mực') || lower.includes('nghêu') || lower.includes('sò') || lower.includes('cua')) {
            caloPer100g = 95;
            refuseRate = 15;
          } else if (lower.includes('trứng')) {
            caloPer100g = 155;
            refuseRate = 10;
          } else if (lower.includes('đậu hũ') || lower.includes('tàu hũ') || lower.includes('đậu phụ')) {
            caloPer100g = 76;
            refuseRate = 0;
          } else if (lower.includes('dầu') || lower.includes('mỡ') || lower.includes('bơ')) {
            caloPer100g = 884;
            refuseRate = 0;
          } else if (lower.includes('khoai') || lower.includes('bắp') || lower.includes('bún') || lower.includes('miến') || lower.includes('bột')) {
            caloPer100g = 135;
            refuseRate = 5;
          } else if (lower.includes('cơm') || lower.includes('gạo')) {
            caloPer100g = 130;
            refuseRate = 0;
          } else if (lower.includes('rau') || lower.includes('cải') || lower.includes('cà chua') || lower.includes('dưa') || lower.includes('ớt') || lower.includes('hành') || lower.includes('nấm')) {
            caloPer100g = 35;
            refuseRate = 8;
          }

          const itemCalo = weight * (1.0 - refuseRate / 100.0) * (caloPer100g / 100.0);
          computedTotalCalo += itemCalo;

          return {
            ingredient_id: idx + 1,
            name,
            quantity_display: quantityDisplay,
            weight_in_grams: weight,
            calo_per_100g: caloPer100g,
            refuse_rate: refuseRate,
          };
        });

        if (computedTotalCalo > 50) {
          dish.total_calo = Math.round(computedTotalCalo);
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      data: dish,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pool = getDbPool();
    const dishId = isNaN(Number(slug)) ? null : Number(slug);

    // Find dish
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM system_dishes WHERE slug = ? OR id = ?',
      [slug, dishId || 0]
    );

    if (rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Không tìm thấy món ăn để xóa.' }, { status: 404 });
    }

    const id = rows[0].id;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM user_dish_interactions WHERE dish_id = ?', [id]);
      await conn.query('DELETE FROM system_dish_ingredients WHERE dish_id = ?', [id]);
      await conn.query('DELETE FROM system_dishes WHERE id = ?', [id]);
      await conn.commit();
      return NextResponse.json({ status: 'success', message: 'Đã xóa món ăn hệ thống thành công.' });
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
