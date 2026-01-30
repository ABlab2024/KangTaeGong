import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    AlertTriangle, Shield,
    Loader2, Bell, ExternalLink, Trophy, Target,
    AlertCircle, Newspaper, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getThreats } from '@/api/simulation';
import { getUserRanking } from '@/api/users';

export default function Dashboard() {
    // Fetch ranking and stats
    const { data: ranking, isLoading: rankingLoading } = useQuery({
        queryKey: ['userRanking'],
        queryFn: getUserRanking,
        staleTime: 30000,
    });

    // Fetch phishing news (threats)
    const { data: news, isLoading: newsLoading } = useQuery({
        queryKey: ['phishingNews'],
        queryFn: () => getThreats(0, 5),
        staleTime: 60000,
    });

    return (
        <div className="min-h-screen bg-void text-white pb-20">
            <Header />

            <main className="container mx-auto px-4 pt-24">
                {/* Training Notice Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/30 rounded-lg p-4 flex items-center gap-4">
                        <div className="p-2 bg-neon-cyan/20 rounded-full">
                            <Bell className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white font-medium">📧 실제 사례 체험 훈련 안내</p>
                            <p className="text-xs text-gray-400">
                                향후 피싱 예방 훈련이 <span className="text-neon-cyan">이메일 또는 문자</span>로 발송될 수 있습니다.
                                실제 피싱처럼 보이지만 100% 교육 목적입니다.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold">보안 대시보드</h1>
                        <p className="text-gray-400">나의 피싱 방어 현황</p>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(160px, auto)]">

                    {/* Defense Rate Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full border-neon-green/30 bg-gradient-to-br from-neon-green/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-sm text-gray-400">방어율</span>
                                <Shield className="w-5 h-5 text-neon-green" />
                            </CardHeader>
                            <CardContent>
                                {rankingLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold font-display text-neon-green">
                                            {ranking?.defense_rate || 100}%
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            방어 {ranking?.defended_count || 0}회 / 노출 {(ranking?.defended_count || 0) + (ranking?.caught_count || 0)}회
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Caught Count Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-sm text-gray-400">속은 횟수</span>
                                <AlertTriangle className="w-5 h-5 text-neon-pink" />
                            </CardHeader>
                            <CardContent>
                                {rankingLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold font-display text-neon-pink">
                                            {ranking?.caught_count || 0}회
                                        </div>
                                        {ranking?.last_caught_type && (
                                            <p className="text-xs text-gray-400 mt-2 truncate">
                                                최근: {ranking.last_caught_type}
                                            </p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Age Group Ranking */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-sm text-gray-400">연령대 순위</span>
                                <Trophy className="w-5 h-5 text-neon-cyan" />
                            </CardHeader>
                            <CardContent>
                                {rankingLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold font-display">
                                            <span className="text-neon-cyan">{ranking?.age_group_rank || 1}</span>
                                            <span className="text-lg text-gray-500">/{ranking?.age_group_total || 1}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            같은 연령대 중
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Overall Ranking */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full border-neon-purple/30 bg-gradient-to-br from-neon-purple/10 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <span className="text-sm text-gray-400">전체 순위</span>
                                <Target className="w-5 h-5 text-neon-purple" />
                            </CardHeader>
                            <CardContent>
                                {rankingLoading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold font-display">
                                            <span className="text-neon-purple">{ranking?.overall_rank || 1}</span>
                                            <span className="text-lg text-gray-500">/{ranking?.overall_total || 1}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            전체 사용자 중
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Vulnerability Summary Card - Extended */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 md:row-span-2"
                    >
                        <Card className="h-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-400">
                                    <AlertCircle className="w-5 h-5" />
                                    내 취약 포인트 분석
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {rankingLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* AI Summary */}
                                        {ranking?.vulnerability_summary ? (
                                            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/5 rounded-lg border border-orange-500/20">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-orange-500/20 rounded-full flex-shrink-0">
                                                        <Target className="w-4 h-4 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-orange-300 mb-1">AI 분석 요약</p>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {ranking.vulnerability_summary}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    아직 취약점 분석이 진행되지 않았습니다. 설문조사를 완료하면 AI가 당신의 관심사와 행동 패턴을 분석하여 피싱/스캠에 취약한 영역을 파악해드립니다.
                                                </p>
                                            </div>
                                        )}

                                        {/* Last Caught Warning */}
                                        {ranking?.last_caught_type && (
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-400">최근 속은 피싱 유형</p>
                                                        <p className="text-xs text-gray-400 mt-1">{ranking.last_caught_type}</p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            이 유형의 피싱 메시지를 더욱 주의하세요.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quick Tips */}
                                        <div className="space-y-2 mb-4">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">주의 사항</p>
                                            <ul className="text-xs text-gray-400 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                                    의심스러운 링크는 클릭하기 전 URL을 확인하세요
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                                    개인정보 입력 요청 시 발신자를 재확인하세요
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                                    급하게 행동을 요구하는 메시지는 의심하세요
                                                </li>
                                            </ul>
                                        </div>

                                        <Link to="/analysis">
                                            <Button variant="outline" size="sm" className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                                                상세 분석 보기 <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Phishing News Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-2 md:row-span-2"
                    >
                        <Card className="h-full border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Newspaper className="w-5 h-5 text-neon-cyan" />
                                    최신 피싱/스캠 뉴스
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {newsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                                        </div>
                                    ) : news?.length > 0 ? (
                                        news.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 mt-2 rounded-full bg-neon-cyan flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-white truncate">
                                                            {item.source_url?.split('/').pop() || '피싱 뉴스'}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                                                            {item.raw_text}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan">
                                                                {item.analysis_json?.type || 'News'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(item.collected_at).toLocaleDateString('ko-KR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.source_url && (
                                                        <a
                                                            href={item.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-500 hover:text-neon-cyan"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>최신 뉴스를 불러오는 중...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
