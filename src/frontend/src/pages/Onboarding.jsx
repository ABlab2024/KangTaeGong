import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '@/api/survey';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import {
    ChevronRight,
    ChevronLeft,
    Loader2,
    Check,
    Sparkles,
    Shield,
    Star,
    Smile,
    Music,
    Cpu,
    TrendingUp,
    Landmark,
    ShoppingBag,
    Briefcase,
    Clapperboard,
    Search,
    Layers,
    PlayCircle,
    MessageSquare,
    HelpCircle,
    User,
    Tv,
    Music2,
    Flame,
    Camera,
    Heart,
    Globe,
    Mic,
    Newspaper,
    Zap,
    Image as ImageIcon,
    BookOpen,
    Hash,
    Coffee,
    Music4,
    Compass,
    Radio,
    Mic2,
    Headphones,
    Ticket,
    Disc,
    PlusSquare,
    Bot,
    Terminal,
    Code,
    Lock,
    Rocket,
    Binary,
    BarChart,
    Wallet,
    Book,
    LineChart,
    Coins,
    Scissors,
    Umbrella,
    PieChart,
    Bell,
    FileWarning,
    ShieldAlert,
    ShoppingCart,
    Package,
    Gift,
    CreditCard,
    UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { V2_SURVEY_DATA } from '@/constants/surveyData';

const ICON_MAP = {
    clapperboard: Clapperboard,
    star: Star,
    smile: Smile,
    music: Music,
    cpu: Cpu,
    "trending-up": TrendingUp,
    landmark: Landmark,
    "shopping-bag": ShoppingBag,
    briefcase: Briefcase,
    sparkles: Sparkles,
    search: Search,
    layers: Layers,
    "play-circle": PlayCircle,
    "message-square": MessageSquare,
    "help-circle": HelpCircle,
    user: User,
    tv: Tv,
    "music-2": Music2,
    flame: Flame,
    camera: Camera,
    heart: Heart,
    globe: Globe,
    mic: Mic,
    newspaper: Newspaper,
    zap: Zap,
    image: ImageIcon,
    "book-open": BookOpen,
    hash: Hash,
    coffee: Coffee,
    "music-4": Music4,
    compass: Compass,
    radio: Radio,
    "mic-2": Mic2,
    headphones: Headphones,
    ticket: Ticket,
    disc: Disc,
    "plus-square": PlusSquare,
    bot: Bot,
    terminal: Terminal,
    code: Code,
    lock: Lock,
    rocket: Rocket,
    binary: Binary,
    "bar-chart": BarChart,
    wallet: Wallet,
    book: Book,
    "line-chart": LineChart,
    coins: Coins,
    scissors: Scissors,
    umbrella: Umbrella,
    "pie-chart": PieChart,
    bell: Bell,
    "file-warning": FileWarning,
    "shield-alert": ShieldAlert,
    "shopping-cart": ShoppingCart,
    package: Package,
    gift: Gift,
    "credit-card": CreditCard,
    "user-plus": UserPlus
};

const Icon = ({ name, size = 20, className = "" }) => {
    const LucideIcon = ICON_MAP[name] || HelpCircle;
    return <LucideIcon size={size} className={className} />;
};

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Intro, 1: Basic Info, 2+: Categories, Final: Summary
    const [formData, setFormData] = useState({
        age: '',
        occupation: '',
        location: '',
        sns_homepage: '',
        recent_ai_link: '',
        content_preferences: [], // Stores selected item titles
    });

    const totalSteps = V2_SURVEY_DATA.length + 2; // Intro + Basic + Categories

    const submitMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                ...formData,
                age: parseInt(formData.age),
                onboarding_completed: true
            };
            return await surveyApi.submitSurvey(payload);
        },
        onSuccess: () => navigate('/dashboard'),
        onError: (err) => alert('에러 발생: ' + err.message),
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleItem = (title) => {
        setFormData(prev => {
            const prefs = prev.content_preferences;
            if (prefs.includes(title)) {
                return { ...prev, content_preferences: prefs.filter(t => t !== title) };
            } else {
                return { ...prev, content_preferences: [...prefs, title] };
            }
        });
    };

    const isBasicValid = formData.age && formData.occupation && formData.location;

    // Render Logic
    return (
        <div className="min-h-screen bg-void text-white relative overflow-hidden font-pretendard">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-magenta/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Progress */}
            {step > 0 && (
                <div className="fixed top-0 left-0 w-full p-6 z-50 bg-void/80 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-4xl mx-auto flex justify-between items-center mb-2">
                        <span className="text-xs font-bold tracking-widest text-neon-cyan uppercase">
                            Step {step} of {totalSteps - 1}
                        </span>
                        <div className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] text-neon-cyan font-bold">
                            {formData.content_preferences.length} SELECTED
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-neon-cyan to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="container max-w-4xl mx-auto px-4 pt-32 pb-40 relative z-10">
                <AnimatePresence mode="wait">
                    {/* STEP 0: INTRO */}
                    {step === 0 && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center space-y-8"
                        >
                            <div className="w-24 h-24 mx-auto rounded-3xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
                                <Sparkles className="text-neon-cyan" size={48} />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                                    Discover Your Vibe
                                </h1>
                                <p className="text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
                                    당신에게 딱 맞춘 보안 시뮬레이션을 시작합니다.<br />관심 있는 주제를 선택하여 나만의 프로필을 완성해주세요.
                                </p>
                            </div>
                            <Button
                                onClick={handleNext}
                                className="h-16 px-12 text-lg font-bold bg-neon-cyan text-black hover:scale-105 transition-transform"
                            >
                                시작하기 <ChevronRight className="ml-2" />
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 1: BASIC INFO */}
                    {step === 1 && (
                        <motion.div
                            key="basic"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="bg-void/40 border-white/5 backdrop-blur-xl">
                                <CardHeader className="text-center">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <User className="text-gray-400" />
                                    </div>
                                    <CardTitle className="text-2xl">기본 정보 설정</CardTitle>
                                    <p className="text-sm text-gray-500">정교한 시뮬레이션을 위해 아래 정보를 입력해주세요.</p>
                                </CardHeader>
                                <CardContent className="grid gap-6 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-gray-500 ml-1">나이</label>
                                            <Input
                                                type="number"
                                                placeholder="예: 25"
                                                value={formData.age}
                                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-widest text-gray-500 ml-1">직업</label>
                                            <Input
                                                placeholder="예: 대학생, 엔지니어"
                                                value={formData.occupation}
                                                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-gray-500 ml-1">지역</label>
                                        <Input
                                            placeholder="예: 서울 강남구"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-center">
                                    <Button
                                        onClick={handleNext}
                                        disabled={!isBasicValid}
                                        className="w-full h-14 bg-white text-black hover:bg-gray-200"
                                    >
                                        다음으로 <ChevronRight className="ml-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEPS 2+: CATEGORIES */}
                    {step >= 2 && step < totalSteps && (
                        <motion.div
                            key={`cat-${step}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-neon-cyan border border-white/10">
                                        <Icon name={V2_SURVEY_DATA[step - 2].icon} size={32} />
                                    </div>
                                </div>
                                <h2 className="text-4xl font-bold">{V2_SURVEY_DATA[step - 2].category}</h2>
                                <p className="text-gray-400 text-lg">{V2_SURVEY_DATA[step - 2].desc}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {V2_SURVEY_DATA[step - 2].items.map((item) => {
                                    const isSelected = formData.content_preferences.includes(item.title);
                                    return (
                                        <motion.div
                                            key={item.title}
                                            whileHover={{ y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleItem(item.title)}
                                            className={`
                                                group relative p-6 rounded-3xl border cursor-pointer transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_30px_rgba(0,243,255,0.15)]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-neon-cyan text-black' : 'bg-white/5 text-gray-400 group-hover:bg-white/10'}`}>
                                                    <Icon name={item.icon} size={24} />
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-neon-cyan border-neon-cyan text-black' : 'border-white/20'}`}>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{item.sub}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-500 border border-white/5">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* FINAL STEP: SUMMARY */}
                    {step === totalSteps && (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                <Check className="text-green-500" size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold">프로필 완성!</h2>
                                <p className="text-gray-400">당신만을 위한 위협 인텔리전스 시스템이 준비되었습니다.</p>
                            </div>

                            <Card className="bg-white/5 border-white/10 text-left">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold tracking-widest text-gray-500 uppercase">선택한 관심 분야 ({formData.content_preferences.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.content_preferences.map(title => (
                                            <span key={title} className="px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs font-medium text-neon-cyan">
                                                {title}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                onClick={() => submitMutation.mutate()}
                                disabled={submitMutation.isPending}
                                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-neon-cyan to-blue-500 text-black hover:opacity-90"
                            >
                                {submitMutation.isPending ? <Loader2 className="animate-spin" /> : "대시보드로 입장하기"}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Nav */}
            {step > 0 && step < totalSteps && (
                <div className="fixed bottom-0 left-0 w-full p-8 z-50 bg-void/90 backdrop-blur-xl border-t border-white/5">
                    <div className="max-w-4xl mx-auto flex justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1}
                            className="h-14 px-8 text-gray-400 hover:text-white"
                        >
                            <ChevronLeft className="mr-2" /> 이전
                        </Button>
                        <div className="flex gap-3">
                            {step >= 2 && (
                                <Button
                                    variant="ghost"
                                    onClick={handleNext}
                                    className="h-14 px-8 text-gray-500 hover:text-white"
                                >
                                    건너뛰기
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                className="h-14 px-12 font-bold bg-white text-black hover:bg-gray-200"
                            >
                                {step === totalSteps - 1 ? "최종 완료" : "다음 단계"} <ChevronRight className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
