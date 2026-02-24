import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
    children: ReactNode;
    href?: string;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
    fullWidth?: boolean;
}

export function Button({
    children,
    href,
    variant = "primary",
    size = "md",
    className = "",
    onClick,
    fullWidth = false,
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90 focus:ring-secondary hover:scale-105 active:scale-95",
        outline: "border border-white/20 text-foreground hover:bg-white/10 hover:border-white/30 focus:ring-white/20",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-white/10",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    const widthStyle = fullWidth ? "w-full" : "";
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={combinedClassName}>
            {children}
        </button>
    );
}
