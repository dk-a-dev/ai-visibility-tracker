"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "../../../lib/utils";

const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post("/auth/register", registerData);
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      router.push("/onboarding");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Visibility Tracker</h1>
          <p className="text-muted-foreground">
            Track your brand across AI platforms
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Create Account</h2>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium mb-2"
              >
                Full Name
              </label>
              <input
                {...register("full_name")}
                type="text"
                id="full_name"
                className={cn(
                  "w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.full_name ? "border-destructive" : "border-border"
                )}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-destructive text-sm mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                className={cn(
                  "w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.email ? "border-destructive" : "border-border"
                )}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                id="password"
                className={cn(
                  "w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.password ? "border-destructive" : "border-border"
                )}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                id="confirmPassword"
                className={cn(
                  "w-full px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.confirmPassword
                    ? "border-destructive"
                    : "border-border"
                )}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary-500 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
