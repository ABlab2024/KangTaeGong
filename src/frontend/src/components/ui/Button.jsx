import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Button = React.forwardRef(({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const variants = {
        default: "bg-gradient-to-r from-neon-cyan/80 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] border border-neon-cyan/20",
        outline: "border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5",
        destructive: "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(255,0,60,0.2)]",
        neon: "bg-transparent border border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] hover:bg-neon-cyan/10"
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-lg",
        icon: "h-10 w-10",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </motion.button>
    );
});
Button.displayName = "Button";

export { Button };
