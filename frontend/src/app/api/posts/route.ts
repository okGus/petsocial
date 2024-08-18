import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';  // Import the UUID library

export async function POST(req: Request) {
    const { userId, content, likes, dislikes } = await req.json();

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
            'INSERT INTO posts (id, user_id, content, likes, dislikes) VALUES (?, ?, ?, ?, ?)',
            [postId, userId, content, likes, dislikes]
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

export async function GET(req: Request) {

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        const [rows] = await connection.execute(
            'SELECT id, user_id, content, created_at, likes, dislikes FROM posts ORDER BY created_at DESC',
        );

        await connection.end();
        // console.log('Fetched posts:', rows); // Log the result for debugging

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}


// Single PUT route to handle both like and dislike operations
export async function PUT(req: Request, { params }: { params: { postId: string } }) {
    const { postId, action } = await req.json(); // Expecting { action: 'like' | 'dislike' }

    if (!['like', 'dislike'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        // Increment likes or dislikes based on the action
        const column = action === 'like' ? 'likes' : 'dislikes';

        if (action === 'like') {
            await connection.execute(
                `UPDATE posts SET ${column} = ${column} + 1 WHERE id = ?`,
                [postId]
            );
        }
        else {
            await connection.execute(
                `UPDATE posts SET ${column} = ${column} - 1 WHERE id = ?`,
                [postId]
            );
        }

        await connection.end();

        return NextResponse.json({ message: `Post ${action}d successfully` });
    } catch (error) {
        console.error(`Error updating post ${action}:`, error);
        return NextResponse.json({ error: `Failed to ${action} post` }, { status: 500 });
    }
}