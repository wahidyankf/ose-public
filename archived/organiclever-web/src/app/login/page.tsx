"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/auth-context";
import { Alert, AlertDescription, Button, Input, Label } from "@open-sharia-enterprise/ts-ui";
import { TentTree } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => (
  <header className="flex h-14 items-center border-b bg-white px-4 lg:px-6">
    <Link href="/" className="flex items-center justify-center">
      <TentTree className="h-6 w-6" />
      <span className="ml-2 text-lg font-bold">Organic Lever</span>
    </Link>
  </header>
);

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  error: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ email, setEmail, password, setPassword, handleSubmit, error }) => (
  <div className="mt-4 rounded-lg bg-white px-8 py-6 text-left shadow-lg">
    <h3 className="text-center text-2xl font-bold">Login to Organic Lever</h3>
    <form onSubmit={handleSubmit}>
      <div className="mt-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            placeholder="Email"
            id="email"
            className="mt-2 w-full rounded-md border px-4 py-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            placeholder="Password"
            id="password"
            className="mt-2 w-full rounded-md border px-4 py-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-baseline justify-between">
          <Button type="submit" className="mt-4 px-6 py-2">
            Login
          </Button>
          <a href="#" className="text-sm text-primary hover:underline">
            Forgot password?
          </a>
        </div>
      </div>
    </form>
    {error && (
      <Alert variant="destructive" className="mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
  </div>
);

const Footer = () => (
  <footer className="flex items-center justify-center border-t bg-white px-4 py-4 lg:px-6">
    <p className="text-xs text-gray-500">
      Don&apos;t have an account?{" "}
      <Link href="/" className="text-primary hover:underline">
        Learn more about Organic Lever
      </Link>
    </p>
  </footer>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated, getIntendedDestination } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      const intendedDestination = getIntendedDestination();
      router.push(intendedDestination || "/dashboard");
    }
  }, [isAuthenticated, router, getIntendedDestination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (!success) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
          error={error}
        />
      </main>
      <Footer />
    </div>
  );
}
