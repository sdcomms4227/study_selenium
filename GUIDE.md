# 네이버 지도 북마크 자동화 가이드

## 1. 환경 설정

### 1.1 Node.js 설치
- [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전을 다운로드하여 설치합니다.
- 설치 후 터미널에서 다음 명령어로 설치를 확인합니다:
  ```bash
  node --version
  npm --version
  ```

### 1.2 프로젝트 설정
1. 프로젝트 디렉토리 생성:
   ```bash
   mkdir study_selenium
   cd study_selenium
   ```

2. 프로젝트 초기화:
   ```bash
   npm init -y
   ```

3. 필요한 패키지 설치:
   ```bash
   npm install selenium-webdriver dotenv
   ```

4. Chrome WebDriver 설치:
   - [Chrome WebDriver 다운로드 페이지](https://chromedriver.chromium.org/downloads)에서 현재 설치된 Chrome 버전과 일치하는 드라이버를 다운로드합니다.
   - 다운로드한 드라이버를 시스템 PATH에 추가하거나 프로젝트 디렉토리에 복사합니다.

### 1.3 환경 변수 설정
1. 프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다:
   ```
   NAVER_USERNAME=your_naver_id
   NAVER_PASSWORD=your_naver_password
   ```

## 2. 프로젝트 구조
```
study_selenium/
├── src/
│   ├── scripts/
│   │   ├── library/
│   │   │   └── library.js
│   │   ├── pool/
│   │   │   └── pool.js
│   │   └── party/
│   │       └── party.js
│   └── utils/
│       └── utils.js
├── .env
├── GUIDE.md
└── README.md
```

## 3. 스크립트 실행 방법

### 3.1 일반 스크립트 실행
1. 터미널에서 프로젝트 디렉토리로 이동:
   ```bash
   cd study_selenium
   ```

2. 스크립트 실행:
   ```bash
   # 도서관 검색
   node src/scripts/library/library.js
   
   # 수영장 검색
   node src/scripts/pool/pool.js
   
   # 파티시설 검색
   node src/scripts/party/party.js
   ```

### 3.2 웹 인터페이스를 통한 실행
1. 서버 실행:
   ```bash
   node src/server.js
   ```

2. 웹 브라우저에서 접속:
   - http://localhost:3000 으로 접속

3. 웹 인터페이스 사용:
   - 검색어 입력
   - 필터 키워드 입력
   - "실행" 버튼 클릭
   - 실행 로그 확인

## 4. 주요 기능

### 4.1 공통 기능
- 네이버 로그인
- 지도 검색
- 검색 결과 스크롤
- 북마크 처리
- 페이지네이션 처리
- 세션 복구

### 4.2 스크립트별 기능
1. 도서관 검색 (`library.js`)
   - 도서관 위치 검색
   - 도서관 정보 북마크

2. 수영장 검색 (`pool.js`)
   - 수영장 위치 검색
   - 수영장 정보 북마크

3. 파티시설 검색 (`party.js`)
   - 파티시설 위치 검색
   - 파티시설 정보 북마크

## 5. 오류 처리

### 5.1 일반적인 오류
- 네트워크 연결 오류
- 요소 찾기 실패
- 세션 만료

### 5.2 해결 방법
1. 네트워크 연결 확인
2. Chrome WebDriver 버전 확인
3. 환경 변수 설정 확인
4. 스크립트 재실행

## 6. 참고 사항
- 스크립트 실행 중에는 Chrome 브라우저를 조작하지 마세요.
- 실행 중 오류가 발생하면 자동으로 세션을 복구합니다.
- 북마크된 항목은 자동으로 건너뛰어 처리됩니다. 