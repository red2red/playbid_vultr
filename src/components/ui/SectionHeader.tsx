interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
    align?: "left" | "center";
}

export function SectionHeader({
    title,
    subtitle,
    className = "",
    align = "center",
}: SectionHeaderProps) {
    return (
        <div className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"} ${className}`}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-6 text-balance leading-[1.1]">
                {title}
            </h2>
            {subtitle && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
