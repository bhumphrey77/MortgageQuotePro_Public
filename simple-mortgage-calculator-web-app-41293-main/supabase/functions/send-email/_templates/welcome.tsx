import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface WelcomeEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  user_name?: string;
}

export const WelcomeEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_name,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Mortgage Quote Pro! 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Mortgage Quote Pro</Heading>
        <Text style={greeting}>Hi {user_name || 'there'}! 🎉</Text>
        <Text style={text}>
          Welcome to Mortgage Quote Pro! We're excited to have you on board.
        </Text>
        <Text style={text}>
          You're all set to start calculating mortgage quotes with ease. Click the button below to get started:
        </Text>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={button}
        >
          Get Started
        </Link>
        <Text
          style={{
            ...text,
            color: '#6b7280',
            marginTop: '24px',
          }}
        >
          Or, copy and paste this confirmation code:
        </Text>
        <code style={code}>{token}</code>
        <Text style={footer}>
          <strong>Mortgage Quote Pro</strong>
          <br />
          Professional mortgage calculations made easy
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '40px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1e40af',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const greeting = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 16px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
};

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '50px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  margin: '24px 0',
};

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  color: '#1e40af',
  fontSize: '20px',
  fontWeight: '600',
  letterSpacing: '2px',
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '40px',
  paddingTop: '24px',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center' as const,
};
