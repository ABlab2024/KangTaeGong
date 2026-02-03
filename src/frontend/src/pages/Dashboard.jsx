import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, TrendingUp, Shield, Activity, Share2, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSimulationStats, getThreats, sendSimulation, getScenarios } from '@/api/simulation';

export default function Dashboard() {
    const queryClient = useQueryClient();
    const [selectedScenario, setSelectedScenario] = useState('password_reset');

    // Fetch simulation stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['simulationStats'],
        queryFn: getSimulationStats,
        staleTime: 30000,
    });

    // Fetch threats
    const { data: threats, isLoading: threatsLoading } = useQuery({
        queryKey: ['threats'],
        queryFn: () => getThreats(0, 5),
        staleTime: 60000,
    });

    // Fetch scenarios
    const { data: scenariosData } = useQuery({
        queryKey: ['scenarios'],
        queryFn: getScenarios,
        staleTime: 300000,
    });

    // Send simulation mutation
    const sendMutation = useMutation({
        mutationFn: sendSimulation,
        onSuccess: () => {
            queryClient.invalidateQueries(['simulationStats']);
            alert('훈련 이메일이 발송되었습니다!');
        },
        onError: (error) => {
            alert('발송 실패: ' + (error.response?.data?.detail || error.message));
        }
    });

    const handleSendSimulation = () => {
        // Find the first threat from query to get a real ID if available
        const latestThreat = threats?.[0]?.id;
        sendMutation.mutate({
            scenario: selectedScenario,
            threat_case_id: latestThreat
        });
    };


    const statCards = [
        {
            label: "차단된 위협",
            value: stats?.total_simulations || 0,
            icon: Shield,
            color: "text-neon-cyan"
        },
        {
            label: "보안 점수",
            value: stats?.security_score || 100,
            icon: Activity,
            color: "text-neon-green"
        },
        {
            label: "클릭률",
            value: stats?.click_rate || (stats?.total_simulations > 0
                ? `${Math.round((stats.clicked_count / stats.total_simulations) * 100)}%`
                : "0%"),
            icon: TrendingUp,
            color: "text-neon-pink"
        },

    ];

    return (
        <div className="min-h-screen bg-void text-white pb-20">
            <Header />

            <main className="container mx-auto px-4 pt-24">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold">보안 대시보드</h1>
                        <p className="text-gray-400">실시간 위협 모니터링 및 훈련 현황</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">리포트 다운로드</Button>
                        <Button size="sm" className="bg-neon-purple/20 text-neon-purple border-neon-purple/50 hover:bg-neon-purple/30">
                            <Share2 className="w-4 h-4 mr-2" /> 공유하기
                        </Button>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px, auto)]">

                    {/* Stats Cards */}
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="md:col-span-1"
                        >
                            <Card className="h-full border-white/5 bg-white/5 hover:border-neon-cyan/30 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <span className="text-sm text-gray-400">{stat.label}</span>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold font-display">
                                        {statsLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Action Card - Send Simulation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full bg-gradient-to-br from-neon-pink/20 to-transparent border-neon-pink/30 relative overflow-hidden">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-neon-pink text-xl">
                                    <AlertTriangle /> 모의 훈련
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <select
                                    value={selectedScenario}
                                    onChange={(e) => setSelectedScenario(e.target.value)}
                                    className="w-full mb-3 p-2 bg-black/40 border border-white/20 rounded text-sm"
                                >
                                    {scenariosData?.scenarios?.map((s) => (
                                        <option key={s.id} value={s.id}>{s.subject}</option>
                                    )) || (
                                            <>
                                                <option value="password_reset">비밀번호 변경</option>
                                                <option value="payment_receipt">결제 영수증</option>
                                                <option value="delivery_notice">택배 배송 안내</option>
                                            </>
                                        )}
                                </select>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleSendSimulation}
                                    disabled={sendMutation.isPending}
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    훈련 시작
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Main Threat Feed (Large) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-3 md:row-span-2"
                    >
                        <Card className="h-full border-neon-cyan/20">
                            <CardHeader>
                                <CardTitle>위협 인텔리전스 피드</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {threatsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                                        </div>
                                    ) : threats?.length > 0 ? (
                                        threats.map((threat) => (
                                            <div key={threat.id} className="flex items-start gap-4 p-4 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 transition-colors">
                                                <div className="w-2 h-2 mt-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]" />
                                                <div>
                                                    <h4 className="font-bold text-white mb-1">
                                                        {threat.source_url?.split('/').pop() || '위협 정보'}
                                                    </h4>
                                                    <p className="text-sm text-gray-400 mb-2">
                                                        {threat.raw_text}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <span className="text-xs px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                                            {threat.analysis_json?.type || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                                                            {new Date(threat.collected_at).toLocaleDateString('ko-KR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            수집된 위협 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* AI Analysis Widget */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="md:col-span-1 md:row-span-2"
                    >
                        <Card className="h-full bg-gradient-to-b from-neon-purple/10 to-transparent border-neon-purple/30">
                            <CardHeader>
                                <CardTitle className="text-lg text-neon-purple">AI 분석 리포트</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-square rounded-full border-4 border-white/5 p-4 relative flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-neon-purple/50 rounded-full border-t-transparent animate-spin-slow" />
                                    <div className="text-center">
                                        <span className="block text-2xl font-bold text-white">
                                            {statsLoading ? '...' : (stats?.security_score >= 70 ? 'Safe' : 'Alert')}
                                        </span>
                                        <span className="text-xs text-gray-500">Status</span>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-400">
                                    총 {stats?.total_simulations || 0}개의 훈련이 진행되었습니다.
                                    {stats?.clicked_count > 0 && (
                                        <span className="block text-neon-pink mt-1">
                                            ⚠️ {stats.clicked_count}회 피싱 링크 클릭
                                        </span>
                                    )}

                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
