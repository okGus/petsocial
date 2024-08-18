import { SignIn } from '@clerk/nextjs';
import { Container, Box } from '@mui/material';

export default function SignInPage() {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <SignIn />
      </Box>
    </Container>
  );
}