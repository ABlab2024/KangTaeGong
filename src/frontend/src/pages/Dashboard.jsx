import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    AlertTriangle, Shield,
    Loader2, Bell, ExternalLink, Trophy, Target,
    AlertCircle, Newspaper, ChevronRight, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getThreats } from '@/api/simulation';
import { getUserRanking } from '@/api/users';

export default function Dashboard() {
    // Number of news items to display
    const [newsCount, setNewsCount] = useState(3);

    // Fetch ranking and stats
    const { data: ranking, isLoading: rankingLoading } = useQuery({
        queryKey: ['userRanking'],
        queryFn: getUserRanking,
        staleTime: 30000,
    });

    // Fetch phishing news (threats) - load more for "show more" feature
    const { data: news, isLoading: newsLoading } = useQuery({
        queryKey: ['phishingNews'],
        queryFn: () => getThreats(0, 20),
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

                    {/* Vulnerability Summary Card - Interactive & Engaging Design */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-2 md:row-span-2"
                    >
                        <Card className="h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30 overflow-hidden relative">
                            {/* Decorative Background Elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-pink-500/10 rounded-full blur-2xl" />
                            </div>

                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <span>내 취약 포인트 분석</span>
                                    </div>
                                    {/* Security Badge */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${(ranking?.defense_rate || 100) >= 80
                                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                                                : (ranking?.defense_rate || 100) >= 50
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                            }`}
                                    >
                                        {(ranking?.defense_rate || 100) >= 80 ? '🛡️ 안전' : (ranking?.defense_rate || 100) >= 50 ? '⚠️ 주의' : '🚨 위험'}
                                    </motion.div>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="relative z-10">
                                {rankingLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                                        <p className="text-sm text-gray-400">분석 중...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Security Level Meter */}
                                        <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm text-gray-400">보안 레벨</span>
                                                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                    {ranking?.defense_rate || 100}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${ranking?.defense_rate || 100}%` }}
                                                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${(ranking?.defense_rate || 100) >= 80
                                                            ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500'
                                                            : (ranking?.defense_rate || 100) >= 50
                                                                ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500'
                                                                : 'bg-gradient-to-r from-red-600 via-pink-600 to-purple-600'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                                <span>위험</span>
                                                <span>안전</span>
                                            </div>
                                        </div>

                                        {/* AI Insight Card */}
                                        {ranking?.vulnerability_summary ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 }}
                                                className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <AlertCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                                            ✨ AI 인사이트
                                                        </p>
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {ranking.vulnerability_summary}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 }}
                                                className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-white/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-700 rounded-lg">
                                                        <Shield className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-300">
                                                            설문조사를 완료하면 AI가 맞춤 분석을 제공합니다
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Risk Alert - Last Caught */}
                                        {ranking?.last_caught_type && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 }}
                                                className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/10 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="p-2 bg-red-500/30 rounded-lg"
                                                    >
                                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                                    </motion.div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-red-400 mb-1">🎯 주의 필요 유형</p>
                                                        <p className="text-xs text-gray-300 bg-red-500/10 px-2 py-1 rounded inline-block">
                                                            {ranking.last_caught_type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Action Button */}
                                        <Link to="/analysis" className="block">
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all group"
                                                >
                                                    <span>상세 분석 보기</span>
                                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </motion.div>
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
                                        <>
                                            {news.slice(0, newsCount).map((item) => {
                                                // Get title: use title field, or first sentence of raw_text, or fallback
                                                const getTitle = () => {
                                                    if (item.title) return item.title;
                                                    if (item.raw_text) {
                                                        const firstSentence = item.raw_text.split(/[.!?。]/)[0];
                                                        return firstSentence.length > 60
                                                            ? firstSentence.substring(0, 60) + '...'
                                                            : firstSentence;
                                                    }
                                                    return '피싱/스캠 뉴스';
                                                };

                                                return (
                                                    <a
                                                        key={item.id}
                                                        href={item.source_url || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-2 h-2 mt-2 rounded-full bg-neon-cyan flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-neon-cyan transition-colors">
                                                                    {getTitle()}
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
                                                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan flex-shrink-0 transition-colors" />
                                                        </div>
                                                    </a>
                                                );
                                            })}

                                            {/* Show more button */}
                                            {news.length > newsCount && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-gray-400 hover:text-neon-cyan hover:bg-white/5"
                                                    onClick={() => setNewsCount(prev => Math.min(prev + 5, news.length))}
                                                >
                                                    <ChevronDown className="w-4 h-4 mr-2" />
                                                    더보기 ({news.length - newsCount}개 더)
                                                </Button>
                                            )}
                                        </>
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
