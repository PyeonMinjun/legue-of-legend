require("dotenv").config();
const axios = require("axios");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");

// ✅ client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let participants = [];
let mainMessage;

// 🔑 Riot API Key
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// 🔤 Data Dragon 챔피언 매핑 (자동 캐싱)
let champNameMap = null;
async function loadChampionNamesKR() {
  if (champNameMap) return champNameMap;

  const versionRes = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
  const latestVersion = versionRes.data[0];

  const champRes = await axios.get(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/ko_KR/champion.json`
  );

  champNameMap = {};
  for (const key in champRes.data.data) {
    const champ = champRes.data.data[key];
    champNameMap[champ.id] = champ.name; // ex) Ahri → 아리
  }
  return champNameMap;
}

// ✅ 최근 20판 기준 모스트 챔피언 (캐싱 적용)
async function getMostPlayedChamps(summonerNameWithTag) {
  try {
    const [name, tag] = summonerNameWithTag.split("#");

    // 1. 소환사 계정 정보
    const accountRes = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        name
      )}/${encodeURIComponent(tag)}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );
    const puuid = accountRes.data.puuid;

    // 2. 최근 20게임 전적
    const matchIdsRes = await axios.get(
      `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );
    const matchIds = matchIdsRes.data;

    const champCounts = {};

    // 3. 챔피언 집계
    for (let matchId of matchIds) {
      const matchRes = await axios.get(
        `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        { headers: { "X-Riot-Token": RIOT_API_KEY } }
      );

      const players = matchRes.data.info.participants;
      const player = players.find((p) => p.puuid === puuid);
      if (player) {
        const champ = player.championName;
        champCounts[champ] = (champCounts[champ] || 0) + 1;
      }
    }

    // 4. 한국어 이름 변환
    const champMap = await loadChampionNamesKR();
    const sorted = Object.entries(champCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([champ]) => champMap[champ] || champ);

    return sorted;
  } catch (err) {
    console.error("라이엇 API 오류:", err.response?.data || err.message);
    return [];
  }
}

// 참가자 Embed
function getParticipantEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("📋 참가자 명단")
    .setColor(0x3498db);

  if (participants.length === 0) {
    embed.setDescription("현재 참가자가 없습니다.");
    return embed;
  }

  let desc = participants
    .map((p, i) => {
      const link = `https://op.gg/ko/lol/summoners/kr/${encodeURIComponent(
        p.summonerId.replace("#", "-")
      )}`;
      return `${i + 1}) [${p.summonerId}](${link})\n   주:${p.primary} | 부:${
        p.secondary
      } | 티어:${p.tier}\n   모스트 챔피언: ${
        p.mostChamps?.join(", ") || "데이터 없음"
      }`;
    })
    .join("\n\n");

  embed.setDescription(desc);
  return embed;
}

// ✅ 로그인 성공
client.once("clientReady", () => {
  console.log(`✅ 로그인 성공! 봇 이름: ${client.user.tag}`);
});

// /대회시작 명령어
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "대회시작") {
    const embed = new EmbedBuilder()
      .setTitle("🎮 리그오브레전드 내전 참가 안내")
      .setDescription("아래 버튼을 눌러 참가하거나 취소할 수 있습니다.")
      .setColor(0x00ae86);

    const joinButton = new ButtonBuilder()
      .setCustomId("join_competition")
      .setLabel("참가하기")
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_competition")
      .setLabel("참가취소")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(joinButton, cancelButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    mainMessage = await interaction.fetchReply();
    await interaction.followUp({ embeds: [getParticipantEmbed()] });
  }
});

// 참가하기 → 모달
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "join_competition") {
    const modal = new ModalBuilder()
      .setCustomId("join_modal")
      .setTitle("리그오브레전드 참가 신청");

    const idInput = new TextInputBuilder()
      .setCustomId("summoner_id")
      .setLabel("아이디#배틀태그 (예: Hide on bush#KR1)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(idInput));
    await interaction.showModal(modal);
  }
});

// 모달 제출 → 드롭다운 표시
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === "join_modal") {
    const summonerId = interaction.fields.getTextInputValue("summoner_id");
    const userId = interaction.user.id;

    let participant = participants.find((p) => p.id === userId);
    if (!participant) {
      participant = {
        id: userId,
        summonerId,
        primary: "",
        secondary: "",
        tier: "",
        mostChamps: [],
      };
      participants.push(participant);
    } else {
      participant.summonerId = summonerId;
    }

    const lineOptions = [
      { label: "탑", value: "탑" },
      { label: "정글", value: "정글" },
      { label: "미드", value: "미드" },
      { label: "원딜", value: "원딜" },
      { label: "서폿", value: "서폿" },
    ];

    const primaryLine = new StringSelectMenuBuilder()
      .setCustomId("primary_line")
      .setPlaceholder("주 라인 선택")
      .addOptions(lineOptions);

    const secondaryLine = new StringSelectMenuBuilder()
      .setCustomId("secondary_line")
      .setPlaceholder("부 라인 선택")
      .addOptions(lineOptions);

    const tierOptions = [
      { label: "Challenger", value: "C" },
      { label: "Grandmaster", value: "GM" },
      { label: "Master", value: "M" },
      { label: "Diamond", value: "D" },
      { label: "Emerald", value: "E" },
      { label: "Platinum", value: "P" },
      { label: "Gold", value: "G" },
      { label: "Silver", value: "S" },
      { label: "Bronze", value: "B" },
      { label: "Iron", value: "I" },
      { label: "Unranked", value: "UR" },
    ];

    const tierMenu = new StringSelectMenuBuilder()
      .setCustomId("tier_select")
      .setPlaceholder("현재 시즌 최고 티어")
      .addOptions(tierOptions);

    await interaction.reply({
      content: `✅ 아이디 \`${summonerId}\` 확인됨. 주라인 / 부라인 / 티어를 모두 선택하세요.`,
      components: [
        new ActionRowBuilder().addComponents(primaryLine),
        new ActionRowBuilder().addComponents(secondaryLine),
        new ActionRowBuilder().addComponents(tierMenu),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
});

// 드롭다운 처리 → 최종 반영
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  const userId = interaction.user.id;
  const participant = participants.find((p) => p.id === userId);
  if (!participant) return;

  if (interaction.customId === "primary_line") {
    participant.primary = interaction.values[0];
  } else if (interaction.customId === "secondary_line") {
    participant.secondary = interaction.values[0];
  } else if (interaction.customId === "tier_select") {
    participant.tier = interaction.values[0];
  }

  if (!(participant.primary && participant.secondary && participant.tier)) {
    await interaction.deferUpdate();
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // ✅ 캐싱: 이미 mostChamps 있으면 다시 호출 안 함
  if (!participant.mostChamps || participant.mostChamps.length === 0) {
    participant.mostChamps = await getMostPlayedChamps(participant.summonerId);
  }

  await interaction.editReply({
    content: `✅ 참가 등록 완료!\nID: ${participant.summonerId} | 주:${participant.primary} | 부:${participant.secondary} | 티어:${participant.tier}\n모스트 챔피언: ${participant.mostChamps.join(", ")}`,
  });

  if (mainMessage) {
    const msgs = await interaction.channel.messages.fetch({ limit: 10 });
    const listMsg = msgs.find(
      (m) => m.embeds.length > 0 && m.embeds[0].title === "📋 참가자 명단"
    );
    if (listMsg) {
      await listMsg.edit({ embeds: [getParticipantEmbed()] });
    }
  }
});

// 참가 취소
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "cancel_competition") {
    const userId = interaction.user.id;
    const beforeCount = participants.length;
    participants = participants.filter((p) => p.id !== userId);

    if (beforeCount === participants.length) {
      await interaction.reply({
        content: "❌ 참가 내역이 없습니다.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "✅ 참가가 취소되었습니다.",
        flags: MessageFlags.Ephemeral,
      });

      if (mainMessage) {
        const msgs = await interaction.channel.messages.fetch({ limit: 10 });
        const listMsg = msgs.find(
          (m) => m.embeds.length > 0 && m.embeds[0].title === "📋 참가자 명단"
        );
        if (listMsg) {
          await listMsg.edit({ embeds: [getParticipantEmbed()] });
        }
      }
    }
  }
});

// ✅ 로그인
client.login(process.env.DISCORD_TOKEN);

