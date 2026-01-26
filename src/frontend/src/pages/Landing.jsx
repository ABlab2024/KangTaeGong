import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import { Shield, Lock, Cpu, ChevronRight } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-void">
            <Header />

            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-neon-cyan/20 blur-[120px] rounded-full pointer-events-none opacity-30" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none opacity-20" />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan text-sm font-medium mb-6 backdrop-blur-sm">
                        AI 기반 차세대 피싱 예방 플랫폼
                    </span>
                    <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
                            낚이지 않는
                        </span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500 neon-text">
                            스마트한 보안 감각
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        당신의 일상을 위협하는 교묘한 피싱 공격. <br />
                        강태공(KangTaeGong)의 AI 에이전트가 24시간 당신을 대신해 위협을 감지하고 훈련시킵니다.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login">
                            <Button size="lg" className="w-full sm:w-auto gap-2">
                                무료로 시작하기
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            작동 원리 보기
                        </Button>
                    </div>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-32">
                    <FeatureCard
                        icon={<Shield className="w-10 h-10 text-neon-cyan" />}
                        title="실시간 위협 수집"
                        desc="전 세계 보안 뉴스와 위협 정보를 실시간으로 수집하고 분석하여 최신 트렌드를 파악합니다."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<Cpu className="w-10 h-10 text-neon-purple" />}
                        title="AI 시뮬레이션"
                        desc="사용자의 취향과 행동 패턴을 분석하여 실제와 구분하기 힘든 맞춤형 모의 공격을 생성합니다."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={<Lock className="w-10 h-10 text-neon-pink" />}
                        title="안전한 격리 훈련"
                        desc="가상 환경에서 안전하게 피싱 메일을 경험하고 대응 능력을 키울 수 있습니다."
                        delay={0.6}
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, desc, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="glass-panel p-8 rounded-2xl text-left hover:border-neon-cyan/50 transition-colors group"
        >
            <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit group-hover:bg-neon-cyan/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-neon-cyan transition-colors">{title}</h3>
            <p className="text-gray-400 group-hover:text-gray-300">{desc}</p>
        </motion.div>
    )
}
