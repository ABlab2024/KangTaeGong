import React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 focus-visible:border-neon-cyan/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };
