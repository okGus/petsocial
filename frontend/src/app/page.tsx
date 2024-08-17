'use client'
import Image from "next/image";
import { Button } from "@mui/material";
import axios from "axios";

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
    <Button variant="contained" color="primary" onClick={buttonPressed}>Press Me</Button>
  );
}
