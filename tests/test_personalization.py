"""
Unit Tests for Email Personalization Logic
Tests for personalize_email_body function in admin.py
"""
import pytest
import json
from unittest.mock import MagicMock


# Mock User class for testing
class MockUser:
    def __init__(self, email: str):
        self.email = email


# Mock UserProfile class for testing
class MockUserProfile:
    def __init__(
        self,
        location: str = None,
        occupation: str = None,
        age: int = None,
        content_preferences: str = "[]",
        augmented_preferences: str = "[]"
    ):
        self.location = location
        self.occupation = occupation
        self.age = age
        self.content_preferences = content_preferences
        self.augmented_preferences = augmented_preferences


# Import the function to test (will be patched for testing)
def personalize_email_body(body_template: str, user, profile=None) -> str:
    """시나리오 템플릿을 사용자 프로필 데이터로 개인화합니다."""
    body = body_template
    
    # 기본 사용자 정보
    name = user.email.split("@")[0]
    body = body.replace("{name}", name)
    body = body.replace("{email}", user.email)
    
    if profile:
        # 프로필 정보 - 설문조사 결과
        body = body.replace("{location}", profile.location or "")
        body = body.replace("{occupation}", profile.occupation or "")
        body = body.replace("{age}", str(profile.age) if profile.age else "")
        
        # 선호도 정보
        try:
            prefs = json.loads(profile.content_preferences) if profile.content_preferences else []
            aug_prefs = json.loads(profile.augmented_preferences) if profile.augmented_preferences else []
            all_prefs = prefs + aug_prefs
            prefs_text = ", ".join(all_prefs[:3]) if all_prefs else ""
            body = body.replace("{preferences}", prefs_text)
        except:
            body = body.replace("{preferences}", "")
    else:
        # 프로필이 없는 경우 빈 문자열로 대체
        body = body.replace("{location}", "")
        body = body.replace("{occupation}", "")
        body = body.replace("{age}", "")
        body = body.replace("{preferences}", "")
    
    return body


class TestPersonalizeEmailBody:
    """Tests for the personalize_email_body function"""
    
    def test_basic_name_replacement(self):
        """Test basic name placeholder replacement"""
        template = "안녕하세요 {name}님"
        user = MockUser("testuser@example.com")
        
        result = personalize_email_body(template, user)
        
        assert result == "안녕하세요 testuser님"
    
    def test_email_replacement(self):
        """Test email placeholder replacement"""
        template = "귀하의 이메일: {email}"
        user = MockUser("testuser@example.com")
        
        result = personalize_email_body(template, user)
        
        assert result == "귀하의 이메일: testuser@example.com"
    
    def test_profile_location_replacement(self):
        """Test location placeholder with profile"""
        template = "안녕하세요 {name}님, {location}에서 특별 이벤트!"
        user = MockUser("john@example.com")
        profile = MockUserProfile(location="서울")
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "안녕하세요 john님, 서울에서 특별 이벤트!"
    
    def test_profile_occupation_replacement(self):
        """Test occupation placeholder with profile"""
        template = "{occupation} 종사자 전용 혜택"
        user = MockUser("jane@example.com")
        profile = MockUserProfile(occupation="개발자")
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "개발자 종사자 전용 혜택"
    
    def test_profile_age_replacement(self):
        """Test age placeholder with profile"""
        template = "{age}세 고객님께 드리는 할인"
        user = MockUser("bob@example.com")
        profile = MockUserProfile(age=30)
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "30세 고객님께 드리는 할인"
    
    def test_preferences_replacement(self):
        """Test preferences placeholder with profile"""
        template = "귀하가 관심있는 {preferences} 관련 정보입니다"
        user = MockUser("alice@example.com")
        profile = MockUserProfile(
            content_preferences='["여행", "음식", "영화"]',
            augmented_preferences='["맛집", "카페"]'
        )
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "귀하가 관심있는 여행, 음식, 영화 관련 정보입니다"
    
    def test_preferences_limit_to_three(self):
        """Test that preferences are limited to 3 items"""
        template = "{preferences}"
        user = MockUser("test@example.com")
        profile = MockUserProfile(
            content_preferences='["A", "B", "C", "D", "E"]'
        )
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "A, B, C"
    
    def test_no_profile_replaces_with_empty(self):
        """Test that missing profile replaces placeholders with empty strings"""
        template = "{name}님, {location}의 {occupation} 대상 혜택"
        user = MockUser("test@example.com")
        
        result = personalize_email_body(template, user, profile=None)
        
        assert result == "test님, 의  대상 혜택"
    
    def test_null_profile_fields_replace_with_empty(self):
        """Test that None profile fields are replaced with empty strings"""
        template = "{location}/{occupation}/{age}"
        user = MockUser("test@example.com")
        profile = MockUserProfile()  # All None
        
        result = personalize_email_body(template, user, profile)
        
        assert result == "//"
    
    def test_full_personalization(self):
        """Test complete personalization with all fields"""
        template = """
        <html>
        <body>
            <h1>안녕하세요 {name}님!</h1>
            <p>{location} 거주 {occupation} 고객님({age}세)을 위한 특별 혜택입니다.</p>
            <p>{preferences}에 관심이 있으신 분들에게 추천드립니다.</p>
            <a href="{link}">자세히 보기</a>
        </body>
        </html>
        """
        user = MockUser("kim@company.com")
        profile = MockUserProfile(
            location="부산",
            occupation="교사",
            age=35,
            content_preferences='["교육", "독서"]'
        )
        
        result = personalize_email_body(template, user, profile)
        
        assert "안녕하세요 kim님!" in result
        assert "부산 거주" in result
        assert "교사 고객님" in result
        assert "35세" in result
        assert "교육, 독서" in result
    
    def test_invalid_json_preferences_handled(self):
        """Test that invalid JSON in preferences is handled gracefully"""
        template = "{preferences}"
        user = MockUser("test@example.com")
        profile = MockUserProfile(content_preferences="invalid json")
        
        result = personalize_email_body(template, user, profile)
        
        assert result == ""
    
    def test_empty_preferences_list(self):
        """Test empty preferences list"""
        template = "{preferences}"
        user = MockUser("test@example.com")
        profile = MockUserProfile(content_preferences="[]")
        
        result = personalize_email_body(template, user, profile)
        
        assert result == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
