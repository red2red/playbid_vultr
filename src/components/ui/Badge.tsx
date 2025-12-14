interface BadgeProps {
    children: React.ReactNode;
    variant?: "blue" | "green" | "slate";
    className?: string; // Allow custom classes
}

export function Badge({ children, variant = "blue", className = "" }: BadgeProps) {
    const variants = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        green: "bg-green-50 text-green-700 border-green-100",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${variants[variant]} uppercase tracking-wider mb-4 ${className}`}>
            {children}
        </span>
    );
}
