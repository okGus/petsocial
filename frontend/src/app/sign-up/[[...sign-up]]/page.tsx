import { SignUp } from '@clerk/nextjs';
import { Container, Box } from '@mui/material';

export default function SignUpPage() {
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
        <SignUp />
      </Box>
    </Container>
  );
}
