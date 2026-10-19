import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, calo_per_100g, refuse_rate FROM nutrition_ingredients ORDER BY name ASC'
    );
    return NextResponse.json({
      status: 'success',
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

