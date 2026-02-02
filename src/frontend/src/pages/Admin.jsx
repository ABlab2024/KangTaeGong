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
    AlertTriangle, TrendingUp, Play, RefreshCw, Eye, X, Edit3, Save, Plus, Check
} from 'lucide-react';

export default function Admin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // Scenario Detail Modal State
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Schedule Creation State
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('10:00');
    const [selectedScenarioId, setSelectedScenarioId] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [showSentSchedules, setShowSentSchedules] = useState(false);

    // Training Detail Modal State
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [editScheduleForm, setEditScheduleForm] = useState({
        title: '',
        date: '',
        time: '',
        scenario_id: ''
    });

    // Queries
    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers(),
        enabled: isLoggedIn,
    });

    const { data: schedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
        queryKey: ['admin-schedule', showSentSchedules],
        queryFn: () => adminApi.getSchedule(showSentSchedules),
        enabled: isLoggedIn,
    });

    const { data: scenarios, isLoading: scenariosLoading, refetch: refetchScenarios } = useQuery({
        queryKey: ['admin-scenarios'],
        queryFn: adminApi.getScenarioPreviews,
        enabled: isLoggedIn,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: adminApi.getStats,
        enabled: isLoggedIn,
    });

    const { data: scenarioStats, isLoading: scenarioStatsLoading } = useQuery({
        queryKey: ['admin-scenario-stats'],
        queryFn: adminApi.getScenarioStats,
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

    const updateScenarioMutation = useMutation({
        mutationFn: ({ id, data }) => adminApi.updateScenario(id, data),
        onSuccess: () => {
            refetchScenarios();
            setIsEditMode(false);
            setSelectedScenario(null);
        },
        onError: (err) => {
            alert('수정 실패: ' + err.message);
        },
    });

    const createScheduleMutation = useMutation({
        mutationFn: ({ userIds, scenarioId, scheduledDate, title }) =>
            adminApi.createSchedule(userIds, scenarioId, scheduledDate, title),
        onSuccess: (data) => {
            alert(`${data.created_count}개의 스케줄이 생성되었습니다!`);
            refetchSchedule();
            setShowScheduleForm(false);
            setSelectedUserIds([]);
            setSelectedScenarioId('');
            setScheduleDate('');
            setScheduleTitle('');
        },
        onError: (err) => {
            alert('스케줄 생성 실패: ' + err.message);
        },
    });

    const updateScheduleMutation = useMutation({
        mutationFn: ({ scheduleId, data }) => adminApi.updateSchedule(scheduleId, data),
        onSuccess: () => {
            alert('스케줄이 수정되었습니다.');
            refetchSchedule();
            setIsEditingSchedule(false);
        },
        onError: (err) => {
            alert('스케줄 수정 실패: ' + err.message);
        },
    });

    const deleteScheduleMutation = useMutation({
        mutationFn: (scheduleId) => adminApi.deleteSchedule(scheduleId),
        onSuccess: () => {
            alert('스케줄이 삭제되었습니다.');
            refetchSchedule();
            setSelectedTraining(null);
        },
        onError: (err) => {
            alert('스케줄 삭제 실패: ' + err.message);
        },
    });

    const handleLogin = (e) => {
        e.preventDefault();
        loginMutation.mutate();
    };

    const handleScenarioClick = async (scenario) => {
        try {
            const detail = await adminApi.getScenarioDetail(scenario.id);
            setSelectedScenario(detail);
            setEditForm({
                name: detail.name,
                description: detail.description || '',
                subject: detail.subject || '',
                body_template: detail.body_template || '',
                sender_name: detail.sender_name || '',
                difficulty: detail.difficulty || 'medium',
            });
            setIsEditMode(false);
        } catch (err) {
            alert('시나리오 조회 실패: ' + err.message);
        }
    };

    const handleSaveScenario = () => {
        updateScenarioMutation.mutate({
            id: selectedScenario.id,
            data: editForm,
        });
    };

    const handleCreateSchedule = () => {
        if (!scheduleDate || !selectedScenarioId || selectedUserIds.length === 0) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        // Create Date object from local date and time inputs
        const localDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
        // Convert to UTC ISO string to ensure consistent server-side processing
        const scheduledDateTime = localDate.toISOString();
        createScheduleMutation.mutate({
            userIds: selectedUserIds,
            scenarioId: selectedScenarioId,
            scheduledDate: scheduledDateTime,
            title: scheduleTitle || null,
        });
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        if (users && users.length > 0) {
            setSelectedUserIds(users.map(u => u.id));
        }
    };

    const deselectAllUsers = () => {
        setSelectedUserIds([]);
    };

    // Schedule editing handlers
    const handleEditScheduleClick = (training) => {
        const scheduledDate = new Date(training.items[0]?.scheduled_date);
        setEditScheduleForm({
            title: training.title || '',
            date: scheduledDate.toISOString().split('T')[0],
            time: scheduledDate.toTimeString().slice(0, 5),
            scenario_id: training.items[0]?.scenario_id || ''
        });
        setIsEditingSchedule(true);
    };

    const handleSaveSchedule = () => {
        if (!selectedTraining) return;

        const localDate = new Date(`${editScheduleForm.date}T${editScheduleForm.time}:00`);
        const scheduledDateTime = localDate.toISOString();

        // Update all schedules in this training group
        const updatePromises = selectedTraining.items
            .filter(item => !item.is_sent)
            .map(item =>
                updateScheduleMutation.mutateAsync({
                    scheduleId: item.id,
                    data: {
                        title: editScheduleForm.title || null,
                        scheduled_date: scheduledDateTime,
                        scenario_id: editScheduleForm.scenario_id || null
                    }
                })
            );

        Promise.all(updatePromises)
            .then(() => {
                setSelectedTraining(null);
            })
            .catch(() => {
                // Error already handled in mutation
            });
    };

    const handleDeleteScheduleGroup = () => {
        if (!selectedTraining) return;

        const unsentItems = selectedTraining.items.filter(item => !item.is_sent);
        if (unsentItems.length === 0) {
            alert('삭제할 수 있는 스케줄이 없습니다.');
            return;
        }

        if (!confirm(`정말로 ${unsentItems.length}개의 스케줄을 삭제하시겠습니까?`)) {
            return;
        }

        // Delete all unsent schedules in this group
        const deletePromises = unsentItems.map(item =>
            deleteScheduleMutation.mutateAsync(item.id)
        );

        Promise.all(deletePromises).catch(() => {
            // Error already handled in mutation
        });
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
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Eye size={20} /> 시나리오 목록
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => refetchScenarios()}>
                                    <RefreshCw size={16} />
                                </Button>
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
                                            <div
                                                key={scenario.id}
                                                onClick={() => handleScenarioClick(scenario)}
                                                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:border-neon-cyan/50 transition-colors"
                                            >
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
                    <div className="space-y-6">
                        {/* Age Group Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* Scenario Stats */}
                        <Card className="border-gray-700">
                            <CardHeader>
                                <CardTitle>시나리오별 통계</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {scenarioStatsLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="animate-spin mx-auto text-neon-cyan" size={32} />
                                    </div>
                                ) : scenarioStats?.scenario_stats?.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">시나리오 통계가 없습니다.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-700 text-gray-400">
                                                    <th className="text-left py-3 px-2">시나리오</th>
                                                    <th className="text-left py-3 px-2">난이도</th>
                                                    <th className="text-center py-3 px-2">발송 수</th>
                                                    <th className="text-center py-3 px-2">클릭 수</th>
                                                    <th className="text-center py-3 px-2">클릭률</th>
                                                    <th className="text-center py-3 px-2">실패율</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scenarioStats?.scenario_stats?.map((stat) => (
                                                    <tr key={stat.scenario_id} className="border-b border-gray-800 text-white">
                                                        <td className="py-3 px-2">{stat.scenario_name}</td>
                                                        <td className="py-3 px-2">
                                                            <span className={`px-2 py-1 rounded text-xs ${stat.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                                                stat.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-green-500/20 text-green-400'
                                                                }`}>
                                                                {stat.difficulty}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-center">{stat.total_sent}</td>
                                                        <td className="py-3 px-2 text-center">{stat.total_clicked}</td>
                                                        <td className="py-3 px-2 text-center">
                                                            <span className={stat.click_rate > 30 ? 'text-yellow-400' : 'text-gray-400'}>
                                                                {stat.click_rate}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-center">
                                                            <span className={stat.fail_rate > 50 ? 'text-red-400' : 'text-green-400'}>
                                                                {stat.fail_rate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        {/* Schedule Creation Form */}
                        <Card className="border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Plus size={20} /> 스케줄 생성하기
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                                >
                                    {showScheduleForm ? '접기' : '펼치기'}
                                </Button>
                            </CardHeader>
                            {showScheduleForm && (
                                <CardContent className="space-y-4">
                                    {/* 훈련 제목 */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">훈련 제목</label>
                                        <Input
                                            type="text"
                                            placeholder="예: 2024년 1월 피싱 훈련"
                                            value={scheduleTitle}
                                            onChange={(e) => setScheduleTitle(e.target.value)}
                                            className="bg-gray-800 border-gray-600"
                                        />
                                    </div>

                                    {/* Date & Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2">날짜</label>
                                            <Input
                                                type="date"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                className="bg-gray-800 border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2">시간</label>
                                            <Input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                                className="bg-gray-800 border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Scenario Selection */}
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">시나리오 선택</label>
                                        <select
                                            value={selectedScenarioId}
                                            onChange={(e) => setSelectedScenarioId(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="">시나리오를 선택하세요</option>
                                            {scenarios?.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* User Selection */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-gray-400 text-sm">발송 대상 사용자</label>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={selectAllUsers}>
                                                    전체 선택
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={deselectAllUsers}>
                                                    전체 해제
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto bg-gray-800/50 rounded-lg p-2 space-y-1">
                                            {users?.map((user) => (
                                                <label
                                                    key={user.id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-white text-sm">{user.email}</span>
                                                    {user.age_group && (
                                                        <span className="text-gray-500 text-xs">({user.age_group})</span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {selectedUserIds.length}명 선택됨
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        onClick={handleCreateSchedule}
                                        disabled={createScheduleMutation.isPending}
                                        className="w-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                                    >
                                        {createScheduleMutation.isPending ? (
                                            <Loader2 className="animate-spin mr-2" size={16} />
                                        ) : (
                                            <Plus className="mr-2" size={16} />
                                        )}
                                        스케줄 생성하기
                                    </Button>
                                </CardContent>
                            )}
                        </Card>

                        {/* Schedule List - Grouped by Title */}
                        <Card className="border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar size={20} /> 훈련 스케줄
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showSentSchedules}
                                            onChange={(e) => setShowSentSchedules(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-gray-400 text-sm">완료된 스케줄 포함</span>
                                    </label>
                                    <Button variant="ghost" size="sm" onClick={() => refetchSchedule()}>
                                        <RefreshCw size={16} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {scheduleLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="animate-spin mx-auto text-neon-cyan" size={32} />
                                    </div>
                                ) : schedule?.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">
                                        {showSentSchedules ? '스케줄이 없습니다.' : '예정된 훈련이 없습니다.'}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(() => {
                                            // Group schedules by title
                                            const groupedSchedules = schedule?.reduce((groups, item) => {
                                                const key = item.title || '제목 없음';
                                                if (!groups[key]) {
                                                    groups[key] = [];
                                                }
                                                groups[key].push(item);
                                                return groups;
                                            }, {});

                                            return Object.entries(groupedSchedules || {}).map(([title, items]) => {
                                                const sentCount = items.filter(i => i.is_sent).length;
                                                const totalCount = items.length;
                                                const allSent = sentCount === totalCount;
                                                const scheduledDate = items[0]?.scheduled_date;
                                                const scenarioName = items[0]?.scenario_name;

                                                return (
                                                    <div
                                                        key={title}
                                                        onClick={() => setSelectedTraining({ title, items })}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${allSent
                                                            ? 'bg-green-900/20 border-green-500/30 hover:border-green-500/60'
                                                            : 'bg-gray-800/50 border-gray-700 hover:border-neon-cyan/50'
                                                            }`}
                                                    >
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                {allSent ? (
                                                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                                                        <Check className="text-green-400" size={18} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-2 bg-neon-cyan/20 rounded-lg">
                                                                        <Calendar className="text-neon-cyan" size={18} />
                                                                    </div>
                                                                )}
                                                                <h3 className="text-white font-semibold truncate max-w-[150px]">
                                                                    {title}
                                                                </h3>
                                                            </div>
                                                            {allSent && (
                                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                                                    완료
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Users size={14} className="text-gray-400" />
                                                                <span className="text-gray-300">
                                                                    {totalCount}명 대상
                                                                </span>
                                                                {!allSent && sentCount > 0 && (
                                                                    <span className="text-green-400 text-xs">
                                                                        ({sentCount}명 발송완료)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Calendar size={14} className="text-gray-400" />
                                                                <span className={allSent ? 'text-green-400' : 'text-neon-cyan'}>
                                                                    {scheduledDate ? new Date(scheduledDate).toLocaleDateString('ko-KR', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    }) : '-'}
                                                                </span>
                                                            </div>
                                                            {scenarioName && (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Shield size={14} className="text-gray-400" />
                                                                    <span className="text-gray-400 truncate">
                                                                        {scenarioName}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Progress Bar */}
                                                        {totalCount > 1 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-700">
                                                                <div className="flex items-center justify-between text-xs mb-1">
                                                                    <span className="text-gray-500">진행률</span>
                                                                    <span className={allSent ? 'text-green-400' : 'text-gray-400'}>
                                                                        {sentCount}/{totalCount}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                                    <div
                                                                        className={`h-1.5 rounded-full transition-all duration-300 ${allSent ? 'bg-green-500' : 'bg-neon-cyan'
                                                                            }`}
                                                                        style={{ width: `${(sentCount / totalCount) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Scenario Detail Modal */}
                {selectedScenario && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">시나리오 상세</h2>
                                <div className="flex items-center gap-2">
                                    {!isEditMode ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditMode(true)}
                                        >
                                            <Edit3 size={16} className="mr-1" /> 수정
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={handleSaveScenario}
                                            disabled={updateScenarioMutation.isPending}
                                            className="bg-neon-cyan/20 text-neon-cyan"
                                        >
                                            {updateScenarioMutation.isPending ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <>
                                                    <Save size={16} className="mr-1" /> 저장
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedScenario(null);
                                            setIsEditMode(false);
                                        }}
                                    >
                                        <X size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">시나리오 이름</label>
                                    {isEditMode ? (
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="bg-gray-800"
                                        />
                                    ) : (
                                        <p className="text-white">{selectedScenario.name}</p>
                                    )}
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">난이도</label>
                                    {isEditMode ? (
                                        <select
                                            value={editForm.difficulty}
                                            onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                                            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="easy">easy</option>
                                            <option value="medium">medium</option>
                                            <option value="hard">hard</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs ${selectedScenario.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                            selectedScenario.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {selectedScenario.difficulty}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">설명</label>
                                    {isEditMode ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white h-20"
                                        />
                                    ) : (
                                        <p className="text-gray-300">{selectedScenario.description || '-'}</p>
                                    )}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">이메일 제목</label>
                                    {isEditMode ? (
                                        <Input
                                            value={editForm.subject}
                                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                            className="bg-gray-800"
                                        />
                                    ) : (
                                        <p className="text-white">{selectedScenario.subject || '-'}</p>
                                    )}
                                </div>

                                {/* Sender Name */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">발신자명</label>
                                    {isEditMode ? (
                                        <Input
                                            value={editForm.sender_name}
                                            onChange={(e) => setEditForm({ ...editForm, sender_name: e.target.value })}
                                            className="bg-gray-800"
                                        />
                                    ) : (
                                        <p className="text-white">{selectedScenario.sender_name || '-'}</p>
                                    )}
                                </div>

                                {/* Body Template */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">이메일 본문</label>
                                    {isEditMode ? (
                                        <textarea
                                            value={editForm.body_template}
                                            onChange={(e) => setEditForm({ ...editForm, body_template: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white h-40 font-mono text-sm"
                                        />
                                    ) : (
                                        <div className="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm whitespace-pre-wrap">
                                            {selectedScenario.body_template || '-'}
                                        </div>
                                    )}
                                </div>

                                {/* Metadata */}
                                <div className="pt-4 border-t border-gray-700 text-gray-500 text-xs">
                                    <p>생성일: {new Date(selectedScenario.created_at).toLocaleString()}</p>
                                    <p>수정일: {new Date(selectedScenario.updated_at).toLocaleString()}</p>
                                    {selectedScenario.is_llm_generated && (
                                        <p className="text-neon-purple">AI 생성 시나리오</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Training Detail Modal */}
                {selectedTraining && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedTraining.items.every(i => i.is_sent)
                                        ? 'bg-green-500/20'
                                        : 'bg-neon-cyan/20'
                                        }`}>
                                        {selectedTraining.items.every(i => i.is_sent) ? (
                                            <Check className="text-green-400" size={20} />
                                        ) : (
                                            <Calendar className="text-neon-cyan" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedTraining.title}</h2>
                                        <p className="text-gray-400 text-sm">
                                            {selectedTraining.items[0]?.scheduled_date &&
                                                new Date(selectedTraining.items[0].scheduled_date).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTraining(null)}
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 overflow-y-auto flex-1">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                        <p className="text-gray-400 text-xs mb-1">총 대상자</p>
                                        <p className="text-white text-2xl font-bold">{selectedTraining.items.length}</p>
                                    </div>
                                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                                        <p className="text-gray-400 text-xs mb-1">발송 완료</p>
                                        <p className="text-green-400 text-2xl font-bold">
                                            {selectedTraining.items.filter(i => i.is_sent).length}
                                        </p>
                                    </div>
                                    <div className="bg-neon-cyan/10 rounded-lg p-3 text-center">
                                        <p className="text-gray-400 text-xs mb-1">대기 중</p>
                                        <p className="text-neon-cyan text-2xl font-bold">
                                            {selectedTraining.items.filter(i => !i.is_sent).length}
                                        </p>
                                    </div>
                                </div>

                                {/* Scenario Info */}
                                {selectedTraining.items[0]?.scenario_name && (
                                    <div className="mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield size={16} className="text-neon-purple" />
                                            <span className="text-gray-400 text-sm">시나리오</span>
                                        </div>
                                        <p className="text-white font-medium">{selectedTraining.items[0].scenario_name}</p>
                                    </div>
                                )}

                                {/* Participants List */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users size={16} className="text-gray-400" />
                                        <span className="text-gray-400 text-sm">참여자 목록</span>
                                    </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {selectedTraining.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`p-3 rounded-lg border flex items-center justify-between ${item.is_sent
                                                    ? 'bg-green-900/10 border-green-500/20'
                                                    : 'bg-gray-800/50 border-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${item.is_sent ? 'bg-green-400' : 'bg-gray-500'
                                                        }`} />
                                                    <span className="text-white">{item.user_email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.is_sent ? (
                                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                                            발송완료
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                                                            대기 중
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-700 bg-gray-900">
                                {/* Edit Form - only show for unsent schedules */}
                                {isEditingSchedule && !selectedTraining.items.every(i => i.is_sent) && (
                                    <div className="mb-4 space-y-4 p-4 bg-gray-800/50 rounded-lg">
                                        <h4 className="text-white font-medium flex items-center gap-2">
                                            <Edit3 size={16} /> 스케줄 수정
                                        </h4>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">훈련 제목</label>
                                            <Input
                                                type="text"
                                                value={editScheduleForm.title}
                                                onChange={(e) => setEditScheduleForm({ ...editScheduleForm, title: e.target.value })}
                                                className="bg-gray-700 border-gray-600"
                                                placeholder="훈련 제목"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-1">날짜</label>
                                                <Input
                                                    type="date"
                                                    value={editScheduleForm.date}
                                                    onChange={(e) => setEditScheduleForm({ ...editScheduleForm, date: e.target.value })}
                                                    className="bg-gray-700 border-gray-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-1">시간</label>
                                                <Input
                                                    type="time"
                                                    value={editScheduleForm.time}
                                                    onChange={(e) => setEditScheduleForm({ ...editScheduleForm, time: e.target.value })}
                                                    className="bg-gray-700 border-gray-600"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">시나리오</label>
                                            <select
                                                value={editScheduleForm.scenario_id}
                                                onChange={(e) => setEditScheduleForm({ ...editScheduleForm, scenario_id: e.target.value })}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                            >
                                                <option value="">시나리오 선택</option>
                                                {scenarios?.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveSchedule}
                                                disabled={updateScheduleMutation.isPending}
                                                className="flex-1 bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                                            >
                                                {updateScheduleMutation.isPending ? (
                                                    <Loader2 className="animate-spin mr-2" size={16} />
                                                ) : (
                                                    <Save className="mr-2" size={16} />
                                                )}
                                                저장
                                            </Button>
                                            <Button
                                                onClick={() => setIsEditingSchedule(false)}
                                                variant="ghost"
                                                className="flex-1"
                                            >
                                                취소
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {!selectedTraining.items.every(i => i.is_sent) && !isEditingSchedule && (
                                        <>
                                            <Button
                                                onClick={() => handleEditScheduleClick(selectedTraining)}
                                                className="flex-1 bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30"
                                            >
                                                <Edit3 className="mr-2" size={16} />
                                                수정
                                            </Button>
                                            <Button
                                                onClick={handleDeleteScheduleGroup}
                                                disabled={deleteScheduleMutation.isPending}
                                                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            >
                                                {deleteScheduleMutation.isPending ? (
                                                    <Loader2 className="animate-spin mr-2" size={16} />
                                                ) : (
                                                    <X className="mr-2" size={16} />
                                                )}
                                                삭제
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={() => {
                                            setSelectedTraining(null);
                                            setIsEditingSchedule(false);
                                        }}
                                        className={`bg-gray-700 hover:bg-gray-600 ${selectedTraining.items.every(i => i.is_sent) || isEditingSchedule ? 'w-full' : 'flex-1'
                                            }`}
                                    >
                                        닫기
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
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
