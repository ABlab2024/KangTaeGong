import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Calendar, Users, Save, Loader2, ArrowLeft, Check, Edit2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser } from '@/api/users';
import client from '@/api/client';

const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
const GENDERS = ['남성', '여성', '기타'];

export default function Settings() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        email: '',
        age_group: '',
        gender: '',
    });
    const [isEmailEditing, setIsEmailEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Fetch current user
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: getCurrentUser,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                email: '', // Show placeholder by default
                age_group: user.age_group || '',
                gender: user.gender || '',
            });
        }
    }, [user]);

    // Update user mutation
    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await client.put('/users/me', data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['currentUser']);
            if (data.email) {
                localStorage.setItem('user_email', data.email);
            }
            setIsEmailEditing(false);
            setFormData(prev => ({ ...prev, email: '' })); // Reset to show placeholder
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (!payload.email) delete payload.email;
        updateMutation.mutate(payload);
    };

    const handleEditEmail = () => {
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
        setIsEmailEditing(true);
    };

    const handleCancelEmailEdit = () => {
        setFormData(prev => ({ ...prev, email: user?.email || '' }));
        setIsEmailEditing(false);
    };

    return (
        <div className="min-h-screen bg-void text-white">
            <Header />

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        돌아가기
                    </button>

                    <h1 className="text-3xl font-display font-bold mb-2">개인정보 설정</h1>
                    <p className="text-gray-400 mb-8">계정 정보를 수정할 수 있습니다</p>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Card className="border-white/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-neon-cyan" />
                                        기본 정보
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Email */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                이메일
                                            </label>
                                            {!isEmailEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={handleEditEmail}
                                                    className="text-xs text-neon-cyan hover:underline flex items-center gap-1"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    수정하기
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEmailEdit}
                                                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                    취소
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder={user?.email}
                                            className={`bg-white/5 border-white/10 ${!isEmailEditing ? 'text-gray-500 cursor-not-allowed opacity-70' : ''}`}
                                            disabled={!isEmailEditing}
                                        />
                                        {isEmailEditing && (
                                            <p className="text-xs text-gray-500">
                                                이메일 변경 시 다음 로그인부터 새 이메일로 접속합니다
                                            </p>
                                        )}
                                    </div>

                                    {/* Age Group */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            연령대
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {AGE_GROUPS.map((age) => (
                                                <button
                                                    key={age}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, age_group: age })}
                                                    className={`p-2 rounded-lg text-sm border transition-all ${formData.age_group === age
                                                        ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {age}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            성별
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {GENDERS.map((gender) => (
                                                <button
                                                    key={gender}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, gender: gender })}
                                                    className={`p-2 rounded-lg text-sm border transition-all ${formData.gender === gender
                                                        ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {gender}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4 border-t border-white/10">
                                        <Button
                                            type="submit"
                                            className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30"
                                            disabled={updateMutation.isPending}
                                        >
                                            {updateMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : saveSuccess ? (
                                                <Check className="w-4 h-4 mr-2" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            {saveSuccess ? '저장됨!' : '변경사항 저장'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
