import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuth } from "../../context/AuthContext";

export function Topbar() {
  const { auth, logout } = useAuth();

  const initials = auth?.user.displayName
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase() ?? "SF";

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <SidebarTrigger />

      <div className="flex items-center gap-3">
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