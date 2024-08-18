'use client'
import Image from "next/image";
import { Button } from "@mui/material";
import axios from "axios";
import { Box, Button, Container, Typography } from "@mui/material";
import UserPage from "./component/UserPage";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const buttonPressed = async () => {
    try {
      const response = await axios.post('http://54.209.38.159:5000/api/message', {
        message: 'Hello World!',
      });
      console.log(response.data.message); // Optional: Log the response from the backend
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  return (
    <Container component="main" maxWidth='xl'>
      <SignedOut>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            // width: '100%',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" gutterBottom>
            Welcome to Our App
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please sign in or sign up to continue:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <Link href="/sign-in" passHref>
              <Button variant="contained" color="primary">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up" passHref>
              <Button variant="contained" color="primary">
                Sign Up
              </Button>
            </Link>
          </Box>
        </Box>
      </SignedOut>
      <SignedIn>
        <UserPage />
      </SignedIn>
    </Container>
  );
}
