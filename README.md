# 네이버 지도 북마크 자동화

네이버 지도에서 특정 키워드로 검색한 결과를 자동으로 북마크하는 자동화 스크립트입니다.

## 기능

- 네이버 지도 자동 로그인
- 키워드 기반 검색
- 검색 결과 자동 스크롤
- 검색 결과 북마크 처리
- 페이지네이션 자동 처리
- 세션 만료 시 자동 복구

## 지원하는 검색 유형

1. 도서관 검색
   - 검색어: "부산광역시 도서관"
   - 필터: ['도서관']

2. 수영장 검색
   - 검색어: "부산광역시 수영장"
   - 필터: ['수영장']

3. 파티시설 검색
   - 검색어: "부산광역시 파티룸"
   - 필터: ['파티룸']

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/study_selenium.git
cd study_selenium
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:
```
NAVER_USERNAME=your_naver_id
NAVER_PASSWORD=your_naver_password
```

4. Chrome WebDriver 설치
- [Chrome WebDriver](https://chromedriver.chromium.org/downloads)를 다운로드하여 시스템 PATH에 추가하세요.

## 실행 방법

### 1. 일반 실행
```bash
# 도서관 검색
npm run library

# 수영장 검색
npm run pool

# 파티시설 검색
npm run party
```

### 2. 웹 인터페이스를 통한 실행
```bash
# 서버 실행
npm start

# 브라우저에서 접속
http://localhost:3000
```

## 주의사항

- 스크립트 실행 중에는 Chrome 브라우저를 조작하지 마세요.
- 실행 중 오류가 발생하면 자동으로 세션을 복구합니다.
- 북마크된 항목은 자동으로 건너뛰어 처리됩니다.

## 라이선스

MIT License

## 상세 가이드

자세한 사용 방법과 설정 방법은 [GUIDE.md](GUIDE.md)를 참조하세요.