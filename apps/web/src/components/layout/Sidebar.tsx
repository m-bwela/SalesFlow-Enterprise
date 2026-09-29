import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";

import { useAuth } from "../../context/AuthContext";
import { getNavigationForRole } from "../../config/navigation";

interface SidebarProps {
  onNavigateStart?: () => void;
}

const SIDEBAR_GROUP_STORAGE_KEY = "salesflow-sidebar-groups";

export function Sidebar({ onNavigateStart }: SidebarProps) {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const role = auth?.roles[0]?.code;
  const navigation = useMemo(() => (role ? getNavigationForRole(role) : []), [role]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    setExpandedGroups((current) => {
      const next = Object.fromEntries(
        navigation.map((group) => [group.title, parsed[group.title] ?? current[group.title] ?? false])
      );

      return next;
    });
  }, [navigation]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SF
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">SalesFlow</span>
            <span className="text-xs text-muted-foreground">Enterprise</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => {
          const isExpanded = expandedGroups[group.title] ?? false;

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel
                className="cursor-pointer justify-between gap-2 rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-muted/70 hover:text-foreground"
                onClick={() => toggleGroup(group.title)}
              >
                <span>{group.title}</span>
                <span
                  aria-label={`Toggle ${group.title}`}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-background hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleGroup(group.title);
                  }}
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </SidebarGroupLabel>

              {isExpanded ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton
                            tooltip={item.title}
                            onClick={() => {
                              if (onNavigateStart) {
                                onNavigateStart();
                                window.setTimeout(() => {
                                  navigate(item.url);
                                }, 500);
                                return;
                              }

                              navigate(item.url);
                            }}
                          >
                            <Icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : null}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {auth?.user.displayName}
          <div>&copy; {new Date().getFullYear()} SalesFlow. All rights reserved.</div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}