import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '@/api/client';

export default function TrainingComplete() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, recorded, error
    const threatId = searchParams.get('id');

    useEffect(() => {
        const recordClick = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setStatus('error');
                    return;
                }

                // 시뮬레이션 클릭 로그 기록
                // threatId가 유효한 UUID 형식이 아닐 경우 null 처리
                const validThreatId = (threatId && threatId !== 'undefined' && threatId.length === 36) ? threatId : null;

                const { error } = await supabase
                    .from('simulation_logs')
                    .insert({
                        user_id: user.id,
                        threat_id: validThreatId,
                        event_type: 'CLICKED',
                        created_at: new Date().toISOString()
                    });


                if (error) throw error;
                setStatus('recorded');
            } catch (err) {
                console.error('Failed to record click:', err);
                setStatus('error');
            }
        };

        recordClick();
    }, [threatId]);

    return (
        <div className="min-h-screen bg-void text-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-xl"
            >
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-neon-pink/20 blur-2xl rounded-full" />
                        <div className="relative bg-black/40 border border-neon-pink/50 p-4 rounded-full">
                            <AlertTriangle className="w-12 h-12 text-neon-pink" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                            방금 클릭하신 링크는 <span className="text-neon-pink">피싱 위협</span>이었습니다!
                        </h1>
                        <p className="text-gray-400 text-lg">
                            걱정 마세요. 이것은 보안 의식을 높이기 위한 <span className="text-white font-semibold">강태공 보안 시뮬레이션</span>입니다.
                        </p>
                    </div>

                    <div className="w-full bg-black/40 border border-white/5 p-6 rounded-xl space-y-4 text-left">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-neon-cyan" /> 피싱 예방 수칙
                        </h2>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                                <span>출처가 불분명한 이메일의 링크나 첨부파일은 절대 클릭하지 마세요.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                                <span>발신자의 이메일 주소를 꼼꼼히 확인하고, 도메인이 정확한지 체크하세요.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                                <span>긴급하거나 공포심을 유발하는 문구에 속지 말고, 공식 고객센터에 직접 문의하세요.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                        <Link to="/dashboard" className="flex-1">
                            <button className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                                대시보드로 돌아가기 <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>

                    {status === 'processing' && (
                        <p className="text-xs text-gray-500 animate-pulse">데이터를 안전하게 기록 중...</p>
                    )}
                    {status === 'recorded' && (
                        <p className="text-xs text-neon-green">훈련 로그가 안전하게 기록되었습니다.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
