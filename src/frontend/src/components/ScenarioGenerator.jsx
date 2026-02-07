
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';

export default function ScenarioGenerator() {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateMutation = useMutation({
        mutationFn: () => adminApi.generateScenario(null, null, mode, mode === 'manual' ? prompt : null),
        onSuccess: () => {
            alert('시나리오가 생성되었습니다.');
            setPrompt('');
            queryClient.invalidateQueries(['admin-scenarios']);
        },
        onError: (err) => {
            alert('생성 실패: ' + err.message);
        },
        onSettled: () => {
            setIsGenerating(false);
        }
    });

    const handleGenerate = () => {
        setIsGenerating(true);
        generateMutation.mutate();
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 border-b border-gray-700 pb-2">
                <button
                    onClick={() => setMode('auto')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${mode === 'auto'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    AI 추천 시나리오
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${mode === 'manual'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    시나리오 직접 생성
                </button>
            </div>

            <div className="min-h-[150px]">
                {mode === 'auto' ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-neon-cyan/5 rounded-lg border border-neon-cyan/20">
                            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                <TrendingUp size={16} className="text-neon-cyan" />
                                최신 위협 트렌드 기반 자동 생성
                            </h4>
                            <p className="text-sm text-gray-400">
                                AI가 수집된 최신 뉴스 및 피싱 사례(Threat Cases)를 분석하여,
                                현재 가장 주의가 필요한 유형의 훈련 시나리오를 자동으로 생성합니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">프롬프트 입력</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="예: 넷플릭스 구독 만료 알림을 가장한 피싱 메일을 만들어줘."
                                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan resize-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (mode === 'manual' && !prompt.trim())}
                    className="bg-neon-cyan hover:bg-neon-cyan/80 text-black font-bold"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            생성 중...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2" size={16} />
                            시나리오 생성
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
