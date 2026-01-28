import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/Button";
import { ShieldCheck, LogIn, User, FileText, RefreshCw, LogOut, ChevronDown, Settings } from 'lucide-react';

export default function Header() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const token = localStorage.getItem('access_token');
    const userEmail = localStorage.getItem('user_email') || '사용자';
    const isLoggedIn = !!token;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    const menuItems = [
        { label: '개인정보 수정', icon: Settings, href: '/settings', color: 'text-gray-300' },
        { label: '분석 리포트 보기', icon: FileText, href: '/analysis', color: 'text-neon-cyan' },
        { label: '취향 다시 선택', icon: RefreshCw, href: '/onboarding', color: 'text-neon-purple' },
    ];

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
                    {isLoggedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm text-white hidden sm:block max-w-[120px] truncate">
                                    {userEmail.split('@')[0]}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                    {/* User Email */}
                                    <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                                        <p className="text-xs text-gray-400">로그인 계정</p>
                                        <p className="text-sm text-white font-medium truncate">{userEmail}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        {menuItems.map((item, i) => (
                                            <Link
                                                key={i}
                                                to={item.href}
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                                            >
                                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                                <span className="text-sm text-gray-300">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-white/10 py-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4 text-red-400" />
                                            <span className="text-sm text-red-400">로그아웃</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button variant="outline" size="sm" className="gap-2">
                                <LogIn className="w-4 h-4" />
                                로그인
                            </Button>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
