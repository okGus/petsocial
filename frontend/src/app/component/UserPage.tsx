'use client';
import { UserButton, useUser } from "@clerk/nextjs";
import { Box, Button, Card, CardContent, Container, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

interface Post {
  id: string;
  userId: string;
  content: string;
  created_at: string;
  likes: number;
  dislikes: number;
}

export default function UserPage() {
    const { user } = useUser(); // Clerk? or some other auth
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState<string>('');

    const [updateCounter, setUpdateCounter] = useState(0);
    const [recommendedOrder, setRecommendedOrder] = useState<string[]>([]);

    const getRecommendations = async (postData: Post[]) => {
        try {
            //First get user ID from Clerk to send
            const userId = user!.id;

            const response = await axios.post('http://localhost:5000/api/recommend', {
                userId: userId,
                posts: postData
              });

            setRecommendedOrder(response.data);
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        }
    }

    useEffect(() => {
        if (user) {
            const fetchPosts = async () => {
                try {
                    const response = await fetch('/api/posts/');
                    if (!response.ok) {
                        throw new Error('Failed to fetch posts');
                    }
                    const data: Post[] = await response.json();
                    await getRecommendations(data);
                    // Restucture the data with the recommendation model
                    setPosts(data);

                    if (recommendedOrder.length > 0) {
                        // Reorder posts based on recommendedOrder
                        const reorderedPosts = [...posts].sort((a, b) => {
                          return recommendedOrder.indexOf(a.content) - recommendedOrder.indexOf(b.content);
                        });
                        setPosts(reorderedPosts);
                        console.log(posts)
                      }
                } catch (error) {
                    console.error('Failed to fetch posts:', error);
                }
            };

            fetchPosts();
        }
    }, [user, updateCounter]);

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
                    body: JSON.stringify({ userId, content: newPost, likes: 0, dislikes: 0 }),
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
                        created_at: result.createdAt,
                        likes: 0,
                        dislikes: 0,
                    },
                ]);
                setNewPost('');
            } catch (error) {
                console.error('Failed to create post:', error);
            }
        }
    };

    const handleLike = async (postId: string) => {
        try {
            // Optimistically update the UI
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId ? { ...post, likes: post.likes + 1 } : post
                )
            );
    
            // Send the API request to update likes
            const response = await fetch(`/api/posts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: postId, action: 'like' }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to like post');
            }
    
            // Optionally, update the state with the new data from the backend

            setUpdateCounter((prev) => prev + 1);
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    }

    const handleDislike = async (postId: string) => {
        try {
            // Optimistically update the UI
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId ? { ...post, dislikes: post.dislikes - 1 } : post
                )
            );
    
            // Send the API request to update likes
            const response = await fetch(`/api/posts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: postId, action: 'dislike' }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to dislike post');
            }
    
            // Optionally, update the state with the new data from the backend

            setUpdateCounter((prev) => prev + 1);
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    }

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
                            {new Date(post.created_at).toLocaleDateString()}
                        </Typography>
                    </CardContent>
                    <Typography variant="caption" color="textSecondary">{post.likes}</Typography>
                    <Button variant="contained" sx={{ml: 10}} onClick={() => handleLike(post.id)}>Like</Button>
                    <Typography variant="caption" color="textSecondary">{post.dislikes}</Typography>
                    <Button variant="contained" sx={{ml: 10}} onClick={() => handleDislike(post.id)}>Dislike</Button>
                    </Card>
                ))}
            </Container>
        </Box>
    );
}