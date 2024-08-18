import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';  // Import the UUID library

export async function POST(req: Request) {
    const { userId, content } = await req.json();

    if (typeof userId !== 'string' || typeof content !== 'string') {
        return NextResponse.json({ error: 'Missing user ID or content' }, { status: 400 });
    }

    try {
        // Create a connection 
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        const postId = uuidv4(); // Generate UUID
        const createdAt = new Date().toISOString(); // Get current timestamp

        // Inert the new post
        const [result] = await connection.execute(
            'INSERT INTO posts (id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        await connection.end();
        
        return NextResponse.json({ 
            id: postId,
            createdAt: createdAt,
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}