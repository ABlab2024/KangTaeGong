export const V2_SURVEY_DATA = [
    {
        category: "영화·드라마",
        icon: "clapperboard",
        desc: "당신을 몰입하게 할 최고의 작품들을 골라주세요.",
        items: [
            { title: "이번주 신작", sub: "새로 뜬 작품만", tags: ["신작", "추천"], icon: "sparkles" },
            { title: "숨은명작", sub: "평점 높은 덜유명", tags: ["명작", "발굴"], icon: "search" },
            { title: "장르픽", sub: "장르별 3편 추천", tags: ["장르", "큐레이션"], icon: "layers" },
            { title: "정주행각", sub: "몰아보기 시리즈", tags: ["시리즈", "정주행"], icon: "play-circle" },
            { title: "짧은리뷰", sub: "스포없이 한줄평", tags: ["리뷰", "노스포"], icon: "message-square" },
            { title: "결정장애끝", sub: "오늘 1편 픽", tags: ["선택", "가이드"], icon: "help-circle" },
            { title: "감독·배우", sub: "필모로 고르기", tags: ["필모", "취향"], icon: "user" },
            { title: "OTT화제작", sub: "화제작 핵심정리", tags: ["화제", "요약"], icon: "tv" }
        ]
    },
    {
        category: "아이돌·연예",
        icon: "star",
        desc: "팬심 저격! 가장 핫한 스타 소식을 만나보세요.",
        items: [
            { title: "신곡·컴백", sub: "이번주 컴백 스케줄", tags: ["컴백", "스케줄"], icon: "music-2" },
            { title: "화제성픽", sub: "실시간 화제의 인물", tags: ["화제", "인기"], icon: "flame" },
            { title: "화보·사진", sub: "레전드 화보·공항패션", tags: ["화보", "패션"], icon: "camera" },
            { title: "덕질꿀팁", sub: "티켓팅·서포트 가이드", tags: ["덕질", "티켓팅"], icon: "heart" },
            { title: "해외스타", sub: "할리우드·해외 토픽", tags: ["글로벌", "할리우드"], icon: "globe" },
            { title: "인터뷰", sub: "깊이 있는 인터뷰 요약", tags: ["인터뷰", "속마음"], icon: "mic" },
            { title: "연예뉴스", sub: "업계 화제·속보", tags: ["속보", "뉴스"], icon: "newspaper" }
        ]
    },
    {
        category: "유머·밈",
        icon: "smile",
        desc: "잠시 쉬어가는 시간, 가장 웃긴 주제는 무엇인가요?",
        items: [
            { title: "오늘의밈", sub: "밈 한 번에 이해", tags: ["밈", "트렌드"], icon: "zap" },
            { title: "짤모음", sub: "주간 웃긴짤 픽", tags: ["짤", "주간"], icon: "image" },
            { title: "밈해설", sub: "유래·맥락 설명", tags: ["해설", "문화"], icon: "book-open" },
            { title: "트윗하이라", sub: "반응 좋은 글만", tags: ["유머", "핫"], icon: "hash" },
            { title: "레딧핫픽", sub: "해외 웃긴썰", tags: ["해외", "썰"], icon: "globe" },
            { title: "아재개그", sub: "가끔 필요한 그맛", tags: ["개그", "가벼움"], icon: "coffee" }
        ]
    },
    {
        category: "음악",
        icon: "music",
        desc: "당신의 고막을 힐링해줄 사운드 트랙.",
        items: [
            { title: "신곡5선", sub: "이번주 신곡만", tags: ["신작", "플리"], icon: "music-4" },
            { title: "장르탐험", sub: "나에게 맞는 장르 입문", tags: ["장르", "발전"], icon: "compass" },
            { title: "인디레이더", sub: "인디 추천 큐레이션", tags: ["인디", "추천"], icon: "radio" },
            { title: "가사한줄", sub: "가사로 감성충전", tags: ["가사", "감성"], icon: "mic-2" },
            { title: "작업플리", sub: "집중용 플레이리스트", tags: ["집중", "업무"], icon: "headphones" },
            { title: "공연소식", sub: "내한·페스티벌", tags: ["공연", "일정"], icon: "ticket" },
            { title: "명반리뷰", sub: "명반 다시 듣기", tags: ["명반", "리뷰"], icon: "disc" }
        ]
    },
    {
        category: "테크·AI",
        icon: "cpu",
        desc: "급변하는 기술 트렌드, 앞서가는 인사이트.",
        items: [
            { title: "툴추천", sub: "바로 쓰는 도구", tags: ["툴", "생산성"], icon: "plus-square" },
            { title: "AI브리핑", sub: "중요한 소식만", tags: ["AI", "뉴스"], icon: "bot" },
            { title: "업무자동화", sub: "반복작업 줄이기", tags: ["자동화", "업무"], icon: "terminal" },
            { title: "튜토리얼", sub: "따라하며 배우기", tags: ["학습", "실전"], icon: "code" },
            { title: "보안체크", sub: "계정·개인정보", tags: ["보안", "체크"], icon: "lock" },
            { title: "스타트업픽", sub: "신제품·서비스", tags: ["스타트업", "신상"], icon: "rocket" },
            { title: "개발한줄팁", sub: "짧은 코드/개념", tags: ["개발", "팁"], icon: "binary" },
            { title: "데이터읽기", sub: "지표·차트 해석", tags: ["데이터", "분석"], icon: "bar-chart" }
        ]
    },
    {
        category: "경제·재테크",
        icon: "trending-up",
        desc: "내 자산을 지키고 키우는 현명한 습관.",
        items: [
            { title: "돈습관", sub: "지출·저축 루틴", tags: ["습관", "가계"], icon: "wallet" },
            { title: "가계부요약", sub: "쉽게 시작하기", tags: ["가계부", "초보"], icon: "book" },
            { title: "시장브리핑", sub: "지표 한눈에", tags: ["시장", "요약"], icon: "line-chart" },
            { title: "투자기초", sub: "용어·원칙 정리", tags: ["기초", "원칙"], icon: "coins" },
            { title: "절세팁", sub: "세금 덜 내기", tags: ["절세", "팁"], icon: "scissors" },
            { title: "연금가이드", sub: "노후 준비 기초", tags: ["연금", "장기"], icon: "umbrella" },
            { title: "소비분석", sub: "소비패턴 리포트", tags: ["소비", "분석"], icon: "pie-chart" },
            { title: "경제해설", sub: "뉴스 맥락 설명", tags: ["해설", "거시"], icon: "globe" }
        ]
    },
    // 반응도/성향 데이터 (추가)
    {
        category: "공공·행정",
        icon: "landmark",
        desc: "공공기관 소식과 행정 안내에 대한 반응입니다.",
        items: [
            { title: "정부지원금", sub: "지원금·환급 정보", tags: ["지원금", "쿠폰"], icon: "coins" },
            { title: "과태료·벌금", sub: "고지 및 지불 안내", tags: ["과태료", "고지"], icon: "file-warning" },
            { title: "행정알림", sub: "민원 및 공공 안내", tags: ["행정", "공지"], icon: "bell" },
            { title: "개인정보보호", sub: "유출 및 보안 경고", tags: ["보안", "유출"], icon: "shield-alert" }
        ]
    },
    {
        category: "쇼핑·결제",
        icon: "shopping-bag",
        desc: "평소 자주 사용하는 쇼핑 및 결제 서비스입니다.",
        items: [
            { title: "쿠팡/네이버", sub: "주요 오픈마켓 이용", tags: ["플랫폼", "쇼핑"], icon: "shopping-cart" },
            { title: "배송알림", sub: "택배 및 배송 상태 확인", tags: ["배송", "알림"], icon: "package" },
            { title: "할인/혜택", sub: "보상 및 포인트 적립", tags: ["보상", "혜택"], icon: "gift" },
            { title: "빠른결제", sub: "간편 및 링크 결제", tags: ["결제", "편의"], icon: "credit-card" }
        ]
    },
    {
        category: "구직·부업",
        icon: "briefcase",
        desc: "새로운 기회와 수익 창출에 대한 관심입니다.",
        items: [
            { title: "취업/이직", sub: "채용 및 면접 연락", tags: ["취준", "면접"], icon: "user-plus" },
            { title: "재택부업", sub: "집에서 하는 수익 활동", tags: ["부업", "재택"], icon: "home" },
            { title: "SNS제안", sub: "오픈채팅/DM 협업 제안", tags: ["SNS", "제안"], icon: "message-square" },
            { title: "단기수익", sub: "고수익 단기 알바", tags: ["고수익", "단기"], icon: "zap" }
        ]
    },
    {
        category: "DIY·공예",
        icon: "scissors",
        desc: "손끝에서 태어나는 세상에 하나뿐인 결과물.",
        items: [
            { title: "초보DIY", sub: "따라하기 쉬운", tags: ["초보", "만들기"], icon: "hammer" },
            { title: "업사이클", sub: "버리지 말고 만들기", tags: ["업사이클", "친환경"], icon: "recycle" },
            { title: "뜨개입문", sub: "도안·실 추천", tags: ["뜨개", "취미"], icon: "palette" },
            { title: "문구덕질", sub: "다꾸·문구 픽", tags: ["문구", "다꾸"], icon: "pen-tool" },
            { title: "소품제작", sub: "집꾸미기 소품", tags: ["소품", "핸드메이드"], icon: "gem" }
        ]
    },
    {
        category: "여행",
        icon: "map",
        desc: "새로운 풍경, 새로운 영감을 찾아서.",
        items: [
            { title: "주말근교", sub: "당일치기 코스", tags: ["근교", "코스"], icon: "car" },
            { title: "가성비여행", sub: "예산 줄이는 팁", tags: ["예산", "팁"], icon: "coins" },
            { title: "맛집동선", sub: "동선으로 짜기", tags: ["동선", "맛집"], icon: "map-pin" },
            { title: "숙소픽", sub: "실패 적은 숙소", tags: ["숙소", "추천"], icon: "bed" },
            { title: "혼자여행", sub: "1인 여행 가이드", tags: ["혼행", "안전"], icon: "user-check" }
        ]
    },
    {
        category: "헬스·피트니스",
        icon: "dumbbell",
        desc: "더 건강한 나를 위한 매일의 투자.",
        items: [
            { title: "근력루틴", sub: "주 3회 구성", tags: ["근력", "루틴"], icon: "gauge" },
            { title: "유산소팁", sub: "지루함 줄이기", tags: ["유산소", "팁"], icon: "wind" },
            { title: "스트레칭", sub: "뻐근함 해결", tags: ["스트레칭", "회복"], icon: "refresh-cw" },
            { title: "수면개선", sub: "잠 퀄리티 올리기", tags: ["수면", "루틴"], icon: "moon" },
            { title: "체중관리", sub: "꾸준히 빼는 법", tags: ["감량", "습관"], icon: "scale" }
        ]
    },
    {
        category: "반려동물",
        icon: "paw-print",
        desc: "우리 집 막내를 위한 모든 꿀팁.",
        items: [
            { title: "행동해석", sub: "행동의 의미", tags: ["행동", "이해"], icon: "message-circle" },
            { title: "훈련기초", sub: "기본 훈련 팁", tags: ["훈련", "초보"], icon: "star" },
            { title: "건강체크", sub: "병원 전 체크", tags: ["건강", "체크"], icon: "stethoscope" },
            { title: "사료간식", sub: "성분·급여 팁", tags: ["사료", "영양"], icon: "bone" }
        ]
    },
    {
        category: "시사·이슈",
        icon: "newspaper",
        desc: "지금 세상은 어떤 이야기를 하고 있나요?",
        items: [
            { title: "오늘이슈", sub: "중요한 것만 5개", tags: ["브리핑", "오늘"], icon: "megaphone" },
            { title: "팩트체크", sub: "진짜인지 확인", tags: ["검증", "팩트"], icon: "check-circle" },
            { title: "세계한눈", sub: "해외 이슈 정리", tags: ["국제", "요약"], icon: "flag" },
            { title: "정책요약", sub: "정책 변화 핵심", tags: ["정책", "정리"], icon: "file-text" }
        ]
    },
    {
        category: "중고거래",
        icon: "handshake",
        desc: "안전하고 기분 좋은 개인 간 거래를 위한 팁입니다.",
        items: [
            { title: "당근/중고나라", sub: "활발한 개인 거래 이용", tags: ["중고거래", "로컬"], icon: "map" },
            { title: "안전거래", sub: "안전결제 서비스 신뢰", tags: ["안전", "결제"], icon: "shield-check" },
            { title: "채팅문의", sub: "실시간 대화 및 협상", tags: ["채팅", "협상"], icon: "messages-square" },
            { title: "택배거래", sub: "비대면 배송 거래", tags: ["비대면", "택배"], icon: "truck" }
        ]
    }
];
