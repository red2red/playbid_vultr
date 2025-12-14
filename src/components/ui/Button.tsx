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
        primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 hover:scale-105 active:scale-95",
        secondary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30",
        outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 focus:ring-slate-900",
        ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
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
