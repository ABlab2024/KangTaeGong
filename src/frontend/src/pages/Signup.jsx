import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { UserPlus, Loader2 } from 'lucide-react';

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
    });

    const registerMutation = useMutation({
        mutationFn: async () => {
            // 회원가입
            await authApi.register(formData.email, formData.password, formData.fullName);
            // 자동 로그인
            const loginResult = await authApi.login(formData.email, formData.password);
            return loginResult;
        },
        onSuccess: (data) => {
            // JWT 토큰 저장
            localStorage.setItem('access_token', data.access_token);
            // 온보딩 페이지로 이동
            navigate('/onboarding');
        },
        onError: (err) => {
            alert('가입 실패: ' + err.message);
        },
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        registerMutation.mutate();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <Card className="z-10 w-full max-w-md border-neon-cyan/20">
                <CardHeader className="text-center">
                    <CardTitle>새 계정 등록</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input name="fullName" placeholder="이름" value={formData.fullName} onChange={handleChange} required />
                        <Input type="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} required />
                        <Input type="password" name="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} required />

                        <Button type="submit" className="w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30" disabled={registerMutation.isPending}>
                            {registerMutation.isPending ? <Loader2 className="animate-spin" /> : <div className="flex gap-2"><UserPlus size={16} /> 가입하기</div>}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link to="/login" className="text-sm text-gray-500 hover:text-white">이미 계정이 있으신가요?</Link>
                </CardFooter>
            </Card>
        </div>
    );
}
