import { NextResponse } from "next/server";
import mysql from 'mysql2/promise';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    const { userId } = params;

    if (!userId) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        const [rows] = await connection.execute(
            'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        await connection.end();

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}