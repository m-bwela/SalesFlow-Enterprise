import type { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({
    children,
    className = "",
}: PageContainerProps) {
    return (
        <div className={`w-full p-6 ${className}`}>
            {children}
        </div>
    );
}