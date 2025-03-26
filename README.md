# Naver Map Scraper

네이버 지도에서 부산광역시의 도서관과 수영장/스포츠센터 정보를 자동으로 수집하고 북마크하는 자동화 도구입니다.

## 기능

- 부산광역시 도서관 자동 검색 및 북마크
- 부산광역시 수영장/스포츠센터 자동 검색 및 북마크
- 실시간 로그 확인
- 웹 인터페이스를 통한 쉬운 사용

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/naver-map-scraper.git
cd naver-map-scraper
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:
```
NAVER_ID=your_naver_id
NAVER_PW=your_naver_password
```

4. Chrome WebDriver 설치
- [Chrome WebDriver](https://sites.google.com/chromium.org/driver/)를 다운로드하여 프로젝트 루트 디렉토리에 설치하세요.

## 실행 방법

1. 서버 실행
```bash
npm start
```

2. 웹 브라우저에서 접속
- http://localhost:3000 으로 접속하세요.

3. 스크립트 실행
- 원하는 스크립트의 "실행" 버튼을 클릭하세요.
- 실시간으로 로그를 확인할 수 있습니다.

## 주의사항

- 네이버 로그인이 필요합니다.
- 자동화된 스크립트 실행 시 네이버의 보안 정책에 따라 캡차 인증이 필요할 수 있습니다.
- 과도한 요청은 IP 차단의 원인이 될 수 있으니 주의하세요.

## 라이선스

MIT License