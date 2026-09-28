import { useState, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff, ShieldCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("admin@salesflow.local");
  const [password, setPassword] = useState("AdminChangeMe123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await authService.login({ email, password });
      await refresh();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      navigate("/portal", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("min-h-screen px-4 py-8 text-[#f8f3ea]", className)} {...props}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border border-[#d9b36a]/20 bg-[#0f1720]/85 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <CardHeader className="space-y-3 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4d68d] via-[#d9b36a] to-[#8d6734] text-sm font-black text-[#120d09] shadow-[0_10px_30px_rgba(217,179,106,0.35)]">S</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d7c29a]">SalesFlow</p>
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-semibold tracking-tight text-[#fffaf0]">Welcome back</CardTitle>
                <CardDescription className="text-sm text-[#d7c29a]">
                  Secure access for your sales operations team.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email" className="text-[#f5f1e6]">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="border-[#d9b36a]/20 bg-[#0b1117]/80 text-[#fffaf0] placeholder:text-[#a89b7c]"
                      required
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password" className="text-[#f5f1e6]">Password</FieldLabel>
                      <a
                        href="#"
                        className="text-sm text-[#d7c29a] underline-offset-4 transition-colors hover:text-[#fff2c7] hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="border-[#d9b36a]/20 bg-[#0b1117]/80 pr-10 text-[#fffaf0] placeholder:text-[#a89b7c]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#d7c29a] transition-colors hover:text-[#fff2c7]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  {error ? (
                    <p className="text-sm text-[#f0b0a6]">{error}</p>
                  ) : null}

                  <div className="space-y-3 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f4d68d] via-[#d9b36a] to-[#b07d36] text-[#120d09] shadow-[0_10px_30px_rgba(217,179,106,0.35)] hover:brightness-110">
                      {isSubmitting ? (
                        <>
                          <Spinner className="size-4" />
                          <span>Verifying account...</span>
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>

                    <Button variant="outline" type="button" className="w-full rounded-xl border-[#d9b36a]/20 bg-[#111b22]/70 text-[#f8f3ea] hover:bg-[#1a252d]">
                      Login with Google
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-[#d9b36a]/25 bg-[#d9b36a]/10 p-3 text-sm text-[#f2ddab]">
                    <ShieldCheck className="h-4 w-4" />
                    Enterprise-grade security and role-based access
                  </div>

                  <FieldDescription className="text-center text-sm text-[#d7c29a]">
                    Don&apos;t have an account? <a href="#" className="font-medium text-[#fffaf0] underline-offset-4 hover:underline">Request access</a>
                  </FieldDescription>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="hidden flex-col justify-center lg:flex">
          <div className="scene relative h-[540px] w-full max-w-[560px] perspective-[1500px]">
            <div className="floating-orb absolute left-8 top-14 h-20 w-20 rounded-full bg-[#d9b36a]/70 blur-2xl" />
            <div className="floating-orb absolute bottom-10 right-10 h-24 w-24 rounded-full bg-[#c7a05d]/60 blur-2xl" />

            <div className="tilt-card absolute left-4 top-12 w-56 rounded-[28px] border border-[#d9b36a]/20 bg-[#131d27]/90 p-4 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#d7c29a]">Live</span>
                <span className="rounded-full bg-[#d9b36a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#f5d99d]">+18.4%</span>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-[#fffaf0]">KES 12.4M</p>
                <div className="h-2 overflow-hidden rounded-full bg-[#1c2631]">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#f4d68d] via-[#d9b36a] to-[#9b6f2a]" />
                </div>
              </div>
            </div>

            <div className="main-panel absolute inset-x-0 bottom-0 mx-auto w-[88%] rounded-[32px] border border-[#d9b36a]/15 bg-[#0b1117]/90 p-5 text-[#f7f1e6] shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#d7c29a]">Overview</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#fffaf0]">Sales command</h3>
                </div>
                <span className="rounded-full bg-[#d9b36a]/15 px-2.5 py-1 text-xs font-medium text-[#f5d99d]">Live</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Orders", value: "2.8k" },
                  { label: "Coverage", value: "96.2%" },
                  { label: "Growth", value: "+18.4%" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#d9b36a]/15 bg-[#111b22]/80 p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#d7c29a]">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-[#fffaf0]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[#d9b36a]/15 bg-[#111b22]/80 p-4">
                <div className="mb-3 flex items-center justify-between text-sm text-[#d7c29a]">
                  <span>Revenue flow</span>
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#f4d68d]" /> 87%</span>
                </div>
                <div className="flex h-28 items-end gap-2">
                  {[38, 44, 52, 64, 72, 88, 96].map((height, index) => (
                    <div
                      key={height + index}
                      className="w-full rounded-t-xl bg-gradient-to-t from-[#e9d8a6] via-[#d9b36a] to-[#8c692d]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
