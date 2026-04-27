const express = require("express");
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events, EmbedBuilder } = require("discord.js");

const app = express();
app.get("/", (req, res) => res.send("LAUREA BOT ONLINE"));
app.listen(3000, () => console.log("Servidor rodando"));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ================== CONFIG ==================
const TOKEN = process.env.TOKEN;
const CARGO_RECLUTA_ID = process.env.CARGO_RECLUTA_ID;
const CANAL_CADASTRO_ID = process.env.CANAL_CADASTRO_ID;
const CANAL_REGISTRO_ID = process.env.CANAL_REGISTRO_ID;
// ============================================

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logado como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_CADASTRO_ID);
  if (!canal) return console.log("❌ Canal de cadastro não encontrado");

  // 🔥 APAGA PAINEL ANTIGO
  const mensagens = await canal.messages.fetch({ limit: 10 });
  const antiga = mensagens.find(msg =>
    msg.author.id === client.user.id &&
    msg.components.length > 0
  );

  if (antiga) {
    await antiga.delete();
  }

  // ✅ CRIA NOVO PAINEL
  const embed = new EmbedBuilder()
    .setTitle("📝 Contratação - LAURÈA ")
    .setDescription("Informe seus dados logo abaixo para contratação.")
    .setColor("Green");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_registro")
      .setLabel("Realizar Registro")
      .setStyle(ButtonStyle.Success)
  );

  await canal.send({ embeds: [embed], components: [row] });
});

// BOTÃO + MODAL
client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isButton()) {
    if (interaction.customId === "abrir_registro") {

      const modal = new ModalBuilder()
        .setCustomId("modal_registro")
        .setTitle("Registro");

      const campos = [
        { id: "nome", label: "NOME COMPLETO" },
        { id: "id", label: "PASSAPORTE" },
        { id: "vulgo", label: "VULGO" },
        { id: "deep", label: "DEEP" },
        { id: "telefone", label: "TELEFONE" }
      ];

      modal.addComponents(
        ...campos.map(c =>
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(c.id)
              .setLabel(c.label)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        )
      );

      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_registro") {
      try {

        const nome = interaction.fields.getTextInputValue("nome");
        const id = interaction.fields.getTextInputValue("id");
        const vulgo = interaction.fields.getTextInputValue("vulgo");
        const deep = interaction.fields.getTextInputValue("deep");
        const telefone = interaction.fields.getTextInputValue("telefone");

        const guild = interaction.guild;
        const member = interaction.member;

        const cargo = guild.roles.cache.get(CARGO_RECLUTA_ID);
        if (cargo) await member.roles.add(cargo);

        await member.setNickname(`#${id}・${nome.toUpperCase()}`);

        let tel = telefone.replace(/\D/g, "");
        if (tel.length >= 9) {
          tel = `(${tel.slice(0,3)}) ${tel.slice(3,6)}-${tel.slice(6,9)}`;
        }

        const canal = guild.channels.cache.get(CANAL_REGISTRO_ID);

        const mensagem =
`👑 **BENVENUTI A LAURÈA** 👑

\`\`\`yaml
👤 NOME:        ${nome.toUpperCase()}
🆔 PASSAPORTE:  ${id.toUpperCase()}
📱 TELEFONE:    ${tel}
🌑 DEEP:        ${deep}
🏷️ VULGO:       ${vulgo}
💬 DISCORD:     ${usuario.username}
\`\`\``;

        if (canal) {
          await canal.send({ content: mensagem });
        }

        await interaction.reply({
          content: "✅ Registro concluído!",
          ephemeral: true
        });

      } catch (err) {
        console.error(err);

        if (!interaction.replied) {
          await interaction.reply({
            content: "❌ Erro no registro.",
            ephemeral: true
          });
        }
      }
    }
  }
});

client.login(TOKEN);
