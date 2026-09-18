import { SidebarTrigger } from "../ui/sidebar";

export function Topbar() {
    return (
        <header className="flex h-16 items-center border-b px-4">
            <SidebarTrigger />
        </header>
    );
}