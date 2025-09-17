# 🎮 League of Legends Tournament Discord Bot

리그 오브 레전드 내전을 효율적으로 운영하기 위한 **디스코드 봇**입니다.  
참가자가 직접 디스코드에서 신청하면 Riot API를 통해 최근 경기 데이터를 불러와  
참가자 명단을 자동으로 관리합니다.

---

## ✨ Features
- `/대회시작` 명령어 → 참가 안내 Embed 메시지 생성
- 참가 버튼 클릭 → 모달 입력 (`소환사명#태그`)
- 드롭다운 메뉴에서:
  - 주 라인 선택 (탑, 정글, 미드, 원딜, 서폿)
  - 부 라인 선택 (탑, 정글, 미드, 원딜, 서폿)
  - 현재 시즌 티어 선택 (C, GM, M, D, E, P, G, S, B, I, UR)
- Riot API 연동:
  - 참가자의 최근 20경기를 분석하여 **모스트 챔피언 Top 5** 자동 표시
  - 챔피언명은 **한국어로 변환**
- 참가자 명단 관리:
  - Embed 카드로 참가자 리스트 업데이트
  - 닉네임 클릭 시 [OP.GG 프로필](https://op.gg)로 이동
- 참가 취소 버튼 → 자신의 등록 내역 삭제 가능
- Riot API Rate Limit 최적화:
  - 최근 20판 기준으로 데이터 집계
  - 캐싱 적용 → 중복 호출 방지

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/discord-lol-tournament-bot.git
cd discord-lol-tournament-bot
```

## 2. Install Dependencies
```bash
npm install
```

## 3. Setup .env
```env
DISCORD_TOKEN=디스코드봇토큰
CLIENT_ID=애플리케이션ID
GUILD_ID=서버ID
RIOT_API_KEY=라이엇API키
```

## 🔑 Required Accounts & Keys

봇 실행을 위해 아래 계정 및 키 발급이 필요합니다:

---

### Discord Developer Portal
- https://discord.com/developers/applications
- 새 애플리케이션 생성 → **Bot** 추가 → **DISCORD_TOKEN** 복사

### Client ID (애플리케이션 ID)
- 애플리케이션 상세 페이지 → **OAuth2 → General** 탭
- **Client Information**의 **Application ID** 복사 → `.env`의 `CLIENT_ID`에 입력

---

### Server ID (Guild ID)
- 디스코드 앱에서 **사용자 설정 → 고급 → 개발자 모드** 활성화
- 서버 아이콘 **우클릭 → 서버 ID 복사**
- 복사한 ID를 `.env`의 `GUILD_ID`에 입력

---

### Riot Games Developer Portal
- https://developer.riotgames.com/
- Riot API Key 발급 후 `.env`의 `RIOT_API_KEY`에 입력  
- ⚠️ 기본 **Development Key**는 **24시간만 유효** → 장기 사용 시 **Production Key** 필요




## 4. Run Bot
```bash
node index.js
```

---

## 🛠️ Tech Stack
- Node.js  
- discord.js  
- Riot API  
- Riot Data Dragon  

---

## ⚠️ Limitations
- 기본 Development Key는 24시간만 유효  
  → 장기 사용 시 Production Key 필요  
- Riot API Rate Limit이 있으므로 참가자 수가 많을 경우 호출 제한 가능  
- 서버에 따라 챔피언명 표기는 최신 Riot Data Dragon 데이터 기준  

---

## 📌 Roadmap
- Riot API 호출 큐 처리로 Rate Limit 안정화  
- 참가자 자동 팀 배정 기능  
- 경기 결과 기록 및 통계 제공  
- 웹 대시보드 연동  

---

## 📄 License



https://developer.riotgames.com/ - 라이엇 개발자사이트 - most챔피언 라이엇 api
discord앱에서 개발자키기 
