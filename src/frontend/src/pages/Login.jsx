import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Shield, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: async () => {
            const data = await authApi.loginWithEmail(email);
            // Save token
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_email', data.email);
            return data;
        },
        onSuccess: (data) => {
            // Navigate based on onboarding status
            if (data.onboarding_completed) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding');
            }
        },
        onError: (err) => {
            console.error(err);
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Basic email validation
        if (!email || !email.includes('@')) {
            setError('올바른 이메일 주소를 입력해주세요.');
            return;
        }

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
                        <p className="text-sm text-gray-400">
                            이메일을 입력하여 시작하세요.<br />
                            처음 방문하시면 자동으로 가입됩니다.
                        </p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-black/40 border-white/10 focus:border-neon-cyan/50 pl-10"
                                        required
                                    />
                                </div>
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
                                        <Mail className="w-5 h-5" />
                                        <span>시작하기</span>
                                    </div>
                                )}
                            </Button>
                        </form>

                        <p className="text-xs text-gray-500 text-center mt-6">
                            시작하기 버튼을 클릭하면 서비스 이용약관에 동의하는 것으로 간주됩니다.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
