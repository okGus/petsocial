'use client';
import { UserButton, useUser } from "@clerk/nextjs";
import { Box, Button, Card, CardContent, Container, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export default function UserPage() {
    const { user } = useUser(); // Clerk? or some other auth
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState<string>('');

    useEffect(() => {
        if (user) {
            const fetchPosts = async () => {
                try {
                    const response = await fetch(`/api/posts/${user.id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch posts');
                    }
                    const data = await response.json();
                    setPosts(data);
                } catch (error) {
                    console.error('Failed to fetch posts:', error);
                }
            };

            fetchPosts();
        }
    }, [user]);

    const handlePostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPost(event.target.value);
    };

    const handlePostSubmit = async () => {
        if (user && newPost.trim()) {
            const userId = user.id;
            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, content: newPost }),
                });
                if (!response.ok) {
                    throw new Error('Failed to create post');
                }
                const result = await response.json();
                setPosts((prevPosts) => [
                    ...prevPosts,
                    {
                        id: result.id, // UUID string
                        userId,
                        content: newPost,
                        createdAt: result.createdAt,
                    },
                ]);
                setNewPost('');
            } catch (error) {
                console.error('Failed to create post:', error);
            }
        }
    };

    return (
        <Box>
            <Box
                display={'flex'}
                height={'70px'}
                justifyContent={'space-between'}
                padding={'20px'}
                sx={{ width: '100%' }}
            >   
                <Typography 
                    variant={"h6"}
                    color={'grey'}
                >
                    Petsocial
                </Typography>
                <UserButton 
                    showName 
                />
            </Box>
            <Container sx={{ mt: 4 }} maxWidth='xs'>
                <Typography variant="h4" gutterBottom>
                    User Posts
                </Typography>
                
                <Box mb={4}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={newPost}
                        onChange={handlePostChange}
                        label="What's on your mind?"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <Button variant="contained" color="primary" onClick={handlePostSubmit} sx={{ mt: 2 }}>
                        Post
                    </Button>
                </Box>
                
                {posts.map((post) => (
                    <Card key={post.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="body1">{post.content}</Typography>
                        <Typography variant="caption" color="textSecondary">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </Typography>
                    </CardContent>
                    </Card>
                ))}
            </Container>
        </Box>
    );
}