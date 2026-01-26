import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, TrendingUp, Shield, Activity, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
    // Mock Data (replace with API calls later)
    const stats = [
        { label: "차단된 위협", value: "1,240", icon: Shield, color: "text-neon-cyan" },
        { label: "모의 훈련 점수", value: "85", icon: Activity, color: "text-neon-green" },
        { label: "위협 트렌드", value: "관심", icon: TrendingUp, color: "text-neon-pink" },
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
                    {stats.map((stat, i) => (
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
                                    <div className="text-4xl font-bold font-display">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Action Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-1"
                    >
                        <Card className="h-full bg-gradient-to-br from-neon-pink/20 to-transparent border-neon-pink/30 relative overflow-hidden group cursor-pointer hover:shadow-[0_0_30px_rgba(255,0,60,0.2)] transition-all">
                            <div className="absolute inset-0 bg-neon-pink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-neon-pink text-xl">
                                    <AlertTriangle /> 긴급 훈련
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-300 mb-4">최근 급증한 '택배 사칭' 스미싱에 대한 긴급 모의 훈련을 시작하세요.</p>
                                <Button variant="destructive" className="w-full">훈련 시작</Button>
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
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="flex items-start gap-4 p-4 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 transition-colors">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]" />
                                            <div>
                                                <h4 className="font-bold text-white mb-1">금융기관 사칭 악성 앱 유포 주의</h4>
                                                <p className="text-sm text-gray-400 mb-2">최근 OO은행을 사칭하여 대출 권유 문자를 발송하고...</p>
                                                <div className="flex gap-2">
                                                    <span className="text-xs px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">Smishing</span>
                                                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">Today</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                                        <span className="block text-2xl font-bold text-white">Safe</span>
                                        <span className="text-xs text-gray-500">Status</span>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-400">
                                    지난 24시간 동안 1,204건의 위협 데이터를 분석했습니다.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
