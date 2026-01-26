import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Shield, Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: async () => {
            const data = await authApi.login(email, password);
            // Save token
            localStorage.setItem('access_token', data.access_token);
            return data;
        },
        onSuccess: () => {
            navigate('/dashboard');
        },
        onError: (err) => {
            console.error(err);
            setError('로그인 실패. 이메일과 비밀번호를 확인해주세요.');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        loginMutation.mutate();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-cyan/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-pink/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10 p-4"
            >
                <Card className="border-neon-cyan/20 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                    <CardHeader className="text-center space-y-4 pb-2">
                        <div className="mx-auto w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30 mb-2">
                            <Shield className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <CardTitle>보안 시스템 접근</CardTitle>
                        <p className="text-sm text-gray-400">KangTaeGong Agent에 접속합니다.</p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/40 border-white/10 focus:border-neon-cyan/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/40 border-white/10 focus:border-neon-cyan/50"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-neon-cyan to-blue-600 hover:to-blue-500 transition-all"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="w-5 h-5" />
                                        <span>인증 시작</span>
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8">
                        <Link to="/signup" className="text-sm text-gray-500 hover:text-neon-cyan transition-colors">
                            계정이 없으신가요? 등록하기
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
