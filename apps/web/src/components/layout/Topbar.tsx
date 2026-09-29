import { useEffect, useState } from "react";
import { LogOut, Moon, Search, SunMedium, User } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuth } from "../../context/AuthContext";

export function Topbar() {
  const { auth, logout } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem("salesflow-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    window.localStorage.setItem("salesflow-theme", theme);
  }, [theme]);

  const initials = auth?.user.displayName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase() ?? "SF";

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />

        <div className="relative hidden w-100 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="outlets, coolers, distributors, products, tickets..."
            className="h-9 border-border/70 bg-muted/30 pl-9 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted"
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{auth?.user.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {auth?.roles[0]?.name ?? auth?.roles[0]?.code}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>
              <User />
              <span>{auth?.user.email}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logout}>
              <LogOut />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}