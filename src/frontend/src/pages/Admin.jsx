import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import ScenarioGenerator from '@/components/ScenarioGenerator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Users, Calendar, Activity, Shield, Lock, Mail, Loader2,
    AlertTriangle, TrendingUp, Play, RefreshCw, Eye
} from 'lucide-react';

export default function Admin() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // Queries
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers(),
        enabled: isLoggedIn,
    });

    const { data: schedule, isLoading: scheduleLoading } = useQuery({
        queryKey: ['admin-schedule'],
        queryFn: () => adminApi.getSchedule(false),
        enabled: isLoggedIn,
    });

    const { data: scenarios, isLoading: scenariosLoading } = useQuery({
        queryKey: ['admin-scenarios'],
        queryFn: adminApi.getScenarioPreviews,
        enabled: isLoggedIn,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: adminApi.getStats,
        enabled: isLoggedIn,
    });

    const { data: nextTraining } = useQuery({
        queryKey: ['admin-next-training'],
        queryFn: adminApi.getNextTrainingPeriod,
        enabled: isLoggedIn,
    });

    // Mutations
    const loginMutation = useMutation({
        mutationFn: () => adminApi.login(email, password),
        onSuccess: (data) => {
            localStorage.setItem('admin_token', data.access_token);
            setIsLoggedIn(true);
            setLoginError('');
        },
        onError: () => {
            setLoginError('관리자 계정 정보가 올바르지 않습니다.');
        },
    });

    const sendSimulationMutation = useMutation({
        mutationFn: () => adminApi.sendSimulation(),
        onSuccess: (data) => {
            alert(`${data.sent_count}명에게 시뮬레이션 발송 완료!`);
        },
        onError: (err) => {
            alert('발송 실패: ' + err.message);
        },
    });

    const handleLogin = (e) => {
        e.preventDefault();
        loginMutation.mutate();
    };

    // Login Screen
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-void flex items-center justify-center">
                <Card className="w-full max-w-md border-neon-purple/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-neon-purple/20 flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-neon-purple" />
                        </div>
                        <CardTitle>관리자 접근</CardTitle>
                        <p className="text-sm text-gray-400">관리자 계정으로 로그인하세요</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="관리자 이메일"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        type="password"
                                        placeholder="비밀번호"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            {loginError && (
                                <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                                    {loginError}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-neon-purple hover:bg-neon-purple/80"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    '로그인'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen bg-void">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">관리자 대시보드</h1>
                        <p className="text-gray-400">피싱 훈련 시스템 관리</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => sendSimulationMutation.mutate()}
                            disabled={sendSimulationMutation.isPending}
                            className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                        >
                            {sendSimulationMutation.isPending ? (
                                <Loader2 className="animate-spin mr-2" size={16} />
                            ) : (
                                <Play className="mr-2" size={16} />
                            )}
                            전체 시뮬레이션 발송
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                localStorage.removeItem('admin_token');
                                setIsLoggedIn(false);
                            }}
                        >
                            로그아웃
                        </Button>
                    </div>
                </div>

                {/* Next Training Notice */}
                {nextTraining && (
                    <Card className="border-neon-cyan/20 mb-6 bg-neon-cyan/5">
                        <CardContent className="py-4 flex items-center gap-4">
                            <Calendar className="text-neon-cyan" size={24} />
                            <div>
                                <p className="text-white font-medium">다음 훈련 예정</p>
                                <p className="text-neon-cyan text-lg font-bold">{nextTraining.period}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<Users className="text-neon-cyan" />}
                        label="총 사용자"
                        value={stats?.total_users || 0}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={<Activity className="text-neon-purple" />}
                        label="총 시뮬레이션"
                        value={stats?.total_simulations || 0}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={<Shield className="text-green-500" />}
                        label="방어 성공"
                        value={stats?.total_defended || 0}
                        loading={statsLoading}
                    />
                    <StatCard
                        icon={<AlertTriangle className="text-red-500" />}
                        label="방어율"
                        value={`${stats?.defense_rate || 0}%`}
                        loading={statsLoading}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
                    {['users', 'scenarios', 'schedule', 'stats'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === tab
                                ? 'bg-neon-cyan/20 text-neon-cyan'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab === 'users' && '사용자 목록'}
                            {tab === 'schedule' && '훈련 스케줄'}
                            {tab === 'scenarios' && '시나리오'}
                            {tab === 'stats' && '상세 통계'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'users' && (
                    <Card className="border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users size={20} /> 등록된 사용자
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => refetchUsers()}>
                                <RefreshCw size={16} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="animate-spin mx-auto text-neon-cyan" size={32} />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700 text-gray-400">
                                                <th className="text-left py-3 px-2">이메일</th>
                                                <th className="text-left py-3 px-2">연령대</th>
                                                <th className="text-left py-3 px-2">성별</th>
                                                <th className="text-left py-3 px-2">보안점수</th>
                                                <th className="text-left py-3 px-2">온보딩</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users?.map((user) => (
                                                <tr key={user.id} className="border-b border-gray-800 text-white">
                                                    <td className="py-3 px-2">{user.email}</td>
                                                    <td className="py-3 px-2">{user.age_group || '-'}</td>
                                                    <td className="py-3 px-2">{user.gender || '-'}</td>
                                                    <td className="py-3 px-2">{user.security_score}</td>
                                                    <td className="py-3 px-2">
                                                        {user.onboarding_completed ? (
                                                            <span className="text-green-400">완료</span>
                                                        ) : (
                                                            <span className="text-yellow-400">미완료</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'scenarios' && (
                    <div className="space-y-6">
                        {/* Scenario Generation */}
                        <Card className="border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw size={20} /> 새 시나리오 생성
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScenarioGenerator />
                            </CardContent>
                        </Card>

                        {/* Scenario List */}
                        <Card className="border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye size={20} /> 시나리오 목록
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {scenariosLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="animate-spin mx-auto text-neon-cyan" size={32} />
                                    </div>
                                ) : scenarios?.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">등록된 시나리오가 없습니다.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {scenarios?.map((scenario) => (
                                            <div key={scenario.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-white font-medium">{scenario.name}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs ${scenario.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                                        scenario.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        {scenario.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-2">
                                                    <strong>제목:</strong> {scenario.subject}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {scenario.body_preview}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 md::grid-cols-2 gap-6">
                        <Card className="border-gray-700">
                            <CardHeader>
                                <CardTitle>연령대별 통계</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.entries(stats?.stats_by_age_group || {}).map(([age, data]) => (
                                    <div key={age} className="flex items-center justify-between py-2 border-b border-gray-800">
                                        <span className="text-white">{age}</span>
                                        <div className="text-right">
                                            <span className="text-gray-400 text-sm">실패율: </span>
                                            <span className={data.fail_rate > 50 ? 'text-red-400' : 'text-green-400'}>
                                                {data.fail_rate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-gray-700">
                            <CardHeader>
                                <CardTitle>성별별 통계</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.entries(stats?.stats_by_gender || {}).map(([gender, data]) => (
                                    <div key={gender} className="flex items-center justify-between py-2 border-b border-gray-800">
                                        <span className="text-white">{gender}</span>
                                        <div className="text-right">
                                            <span className="text-gray-400 text-sm">실패율: </span>
                                            <span className={data.fail_rate > 50 ? 'text-red-400' : 'text-green-400'}>
                                                {data.fail_rate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <Card className="border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar size={20} /> 예정된 훈련
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {scheduleLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="animate-spin mx-auto text-neon-cyan" size={32} />
                                </div>
                            ) : schedule?.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">예정된 훈련이 없습니다.</p>
                            ) : (
                                <div className="space-y-2">
                                    {schedule?.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                                            <span className="text-white">{item.user_email}</span>
                                            <span className="text-gray-400">{item.scenario_name || '미정'}</span>
                                            <span className="text-neon-cyan">
                                                {new Date(item.scheduled_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, loading }) {
    return (
        <Card className="border-gray-700">
            <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-lg">{icon}</div>
                <div>
                    <p className="text-gray-400 text-sm">{label}</p>
                    {loading ? (
                        <Loader2 className="animate-spin text-gray-500" size={20} />
                    ) : (
                        <p className="text-2xl font-bold text-white">{value}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
