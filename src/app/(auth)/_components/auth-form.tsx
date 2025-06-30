"use client";

import { P, paragraphVariants } from "@/components/custom/p";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { RiGoogleFill, RiLoader3Fill } from "@remixicon/react";
import { authClient } from "@/lib/better-auth/auth-client";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  action: "Sign In" | "Sign Up";
}

const AuthForm = ({ action }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            toast.success("Redirecting to Google sign-in page");
          },
          onError: (c) => {
            toast.error(c.error?.message || "Authentication failed");
          },
          // Remove onRequest and onResponse if using try/catch
        }
      );
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-96 drop-shadow-2xl">
      <CardHeader>
        <CardTitle
          className={paragraphVariants({ size: "large", weight: "bold" })}
        >
          {action}
        </CardTitle>
        <CardDescription>{action} to access your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="lift"
          disabled={isLoading}
          aria-busy={isLoading}
          aria-label={`${action} with Google`}
          onClick={handleGoogleSignIn}
        >
          {!isLoading ? (
            <RiGoogleFill />
          ) : (
            <RiLoader3Fill className="animate-spin" />
          )}{" "}
          {action} with Google
        </Button>
        <P
          variant="muted"
          size="small"
          weight="light"
          className="w-full text-center"
        >
          {action === "Sign In" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="link">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="link">
                Sign In
              </Link>
            </>
          )}
        </P>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
