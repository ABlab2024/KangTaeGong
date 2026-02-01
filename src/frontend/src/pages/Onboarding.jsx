import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '@/api/survey';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { ChevronRight, ChevronLeft, Loader2, Check, Sparkles } from 'lucide-react';

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        age: '',
        occupation: '',
        location: '',
        sns_homepage: '',
        recent_ai_link: '',
        content_preferences: [],
    });

    // 카테고리 목록 조회 및 그룹화
    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: surveyApi.getCategories,
    });

    const categoryGroups = React.useMemo(() => {
        if (!categories) return [];
        const groups = {};
        categories.forEach(cat => {
            const groupName = cat.category_group || '기타';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(cat);
        });
        return Object.entries(groups).map(([name, cats]) => ({
            group: name,
            categories: cats
        }));
    }, [categories]);

    // 설문 제출 mutation
    const submitMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                ...formData,
                age: parseInt(formData.age),
            };
            return await surveyApi.submitSurvey(payload);
        },
        onSuccess: () => {
            navigate('/dashboard');
        },
        onError: (err) => {
            alert('설문 제출 실패: ' + err.message);
        },
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleCategory = (categoryName) => {
        setFormData((prev) => {
            const prefs = prev.content_preferences;
            if (prefs.includes(categoryName)) {
                return { ...prev, content_preferences: prefs.filter((c) => c !== categoryName) };
            } else {
                return { ...prev, content_preferences: [...prefs, categoryName] };
            }
        });
    };

    const isStep1Valid = formData.age && formData.occupation && formData.location;
    const isStep2Valid = formData.content_preferences.length >= 3;

    const handleNext = () => {
        if (step === 1 && isStep1Valid) {
            setStep(2);
        } else if (step === 2) {
            submitMutation.mutate();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className="min-h-screen bg-void relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-magenta/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Sparkles className="text-neon-cyan" size={28} />
                        <h1 className="text-3xl font-bold text-white">맞춤 설정</h1>
                    </div>
                    <p className="text-gray-400">
                        당신에게 맞는 피싱 시뮬레이션을 제공하기 위해 몇 가지 정보가 필요합니다
                    </p>
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`w-32 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-neon-cyan' : 'bg-gray-700'}`} />
                    <div className={`w-32 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-neon-cyan' : 'bg-gray-700'}`} />
                </div>

                {/* Step 1: 기본 정보 */}
                {step === 1 && (
                    <Card className="border-neon-cyan/20 backdrop-blur-sm bg-void/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center text-sm">1</span>
                                기본 정보
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">나이 *</label>
                                <Input
                                    type="number"
                                    name="age"
                                    placeholder="예: 25"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    min={1}
                                    max={120}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">직업 *</label>
                                <Input
                                    name="occupation"
                                    placeholder="예: 대학생, 회사원, 프리랜서"
                                    value={formData.occupation}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">사는 곳 *</label>
                                <Input
                                    name="location"
                                    placeholder="예: 서울, 경기도 수원시"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* 선택 항목 */}
                            <div className="pt-4 border-t border-gray-700">
                                <p className="text-xs text-gray-500 mb-4">선택 항목 (더 정교한 시뮬레이션을 위해 입력해주세요)</p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">SNS/유튜브 첫 화면 요구사항</label>
                                        <Input
                                            name="sns_homepage"
                                            placeholder="예: 게임 영상, 뷰티 컨텐츠, 뉴스"
                                            value={formData.sns_homepage}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">가장 최근 AI 대화 링크</label>
                                        <Input
                                            name="recent_ai_link"
                                            placeholder="예: ChatGPT 대화 공유 링크"
                                            value={formData.recent_ai_link}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button
                                onClick={handleNext}
                                disabled={!isStep1Valid}
                                className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
                            >
                                다음 <ChevronRight size={16} />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 2: 취향 선택 */}
                {step === 2 && (
                    <Card className="border-neon-magenta/20 backdrop-blur-sm bg-void/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-neon-magenta/20 text-neon-magenta flex items-center justify-center text-sm">2</span>
                                관심 분야 선택
                            </CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                                최소 3개 이상 선택해주세요 ({formData.content_preferences.length}개 선택됨)
                            </p>
                        </CardHeader>
                        <CardContent>
                            {categoriesLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-neon-cyan" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {categoryGroups?.map((group) => (
                                        <div key={group.group}>
                                            <h3 className="text-sm font-medium text-gray-400 mb-3">{group.group}</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {group.categories.map((category) => {
                                                    const isSelected = formData.content_preferences.includes(category.name);
                                                    return (
                                                        <button
                                                            key={category.id}
                                                            onClick={() => toggleCategory(category.name)}
                                                            className={`
                                                                relative p-4 rounded-xl border-2 transition-all duration-200
                                                                flex flex-col items-center gap-2 text-center
                                                                ${isSelected
                                                                    ? 'border-neon-cyan bg-neon-cyan/10 text-white'
                                                                    : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white'
                                                                }
                                                            `}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Check size={16} className="text-neon-cyan" />
                                                                </div>
                                                            )}
                                                            <span className="text-2xl">{category.icon}</span>
                                                            <span className="text-sm font-medium">{category.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button
                                onClick={handleBack}
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                            >
                                <ChevronLeft size={16} /> 이전
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={!isStep2Valid || submitMutation.isPending}
                                className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <>완료 <Check size={16} /></>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
