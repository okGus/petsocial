import { Webhook, type WebhookRequiredHeaders } from 'svix';
import { type WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise'

export async function POST(req: Request) {
    console.log("webhook received");

    // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = req.headers;
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error outunsafe
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: 'Error occured -- no svix headers' }, { status: 400 });
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
        } as WebhookRequiredHeaders) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return NextResponse.json({ error: 'Error occured'}, { status: 400 });
    }

    const eventType = evt.type;
    if (eventType === 'user.created') {
        const { id } = evt.data;
        // console.log(id);
        
        // create MySQL connection
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        try {
            const [result] = await connection.execute(
                'INSERT INTO users (user_id) values (?)',
                [id]
            );
            // console.log("User added to MySQL database:", result);
            return NextResponse.json({ message: 'User added successfully' }, { status: 200 });
        } catch (error) {
            console.error("Error inserting user into MySQL:", error);
            return NextResponse.json({ error: 'Error inserting user into database' }, { status: 500 });
        } finally {
            await connection.end();
        }
    }

    return Response.json({ message: 'Webhook received' }, { status: 200 });
}