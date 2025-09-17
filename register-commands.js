// register-commands.js
require("dotenv").config();
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Application ID (포털 → General Information)
const GUILD_ID = process.env.GUILD_ID;   // 디스코드 서버 ID

// 등록할 명령어
const commands = [
  {
    name: "대회시작",
    description: "리그오브레전드 내전 참가 안내 메시지를 띄웁니다.",
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ /대회시작 명령어 등록 완료!");
  } catch (err) {
    console.error("❌ 명령어 등록 실패:", err);
  }
})();

