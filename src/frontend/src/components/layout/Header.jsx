import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/Button";
import { ShieldCheck, LogIn } from 'lucide-react';

export default function Header() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-void/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <ShieldCheck className="w-8 h-8 text-neon-cyan" />
                    <span className="text-xl font-display font-bold text-white tracking-wider">
                        KANG<span className="text-neon-cyan">TAEGONG</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link to="/features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        기능 소개
                    </Link>
                    <Link to="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        요금제
                    </Link>
                    <Link to="/login">
                        <Button variant="outline" size="sm" className="gap-2">
                            <LogIn className="w-4 h-4" />
                            로그인
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
