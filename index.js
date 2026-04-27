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

// ================== CONFIG SEGURA ==================
const TOKEN = process.env.TOKEN;
const CARGO_RECLUTA_ID = process.env.CARGO_RECLUTA_ID;
const CANAL_CADASTRO_ID = process.env.CANAL_CADASTRO_ID;
const CANAL_REGISTRO_ID = process.env.CANAL_REGISTRO_ID;
// ====================================================

client.once(Events.ClientReady, () => {
  console.log(`✅ Logado como ${client.user.tag}`);
});

// BOTÃO + MODAL
client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isButton()) {
    if (interaction.customId === "abrir_registro") {

      const modal = new ModalBuilder()
        .setCustomId("modal_registro")
        .setTitle("Registro LAUREA");

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

        // cargo
        const cargo = guild.roles.cache.get(CARGO_RECLUTA_ID);
        await member.roles.add(cargo);

        // nickname
        await member.setNickname(`#${id}・${nome.toUpperCase()}`);

        // telefone formatado
        let tel = telefone.replace(/\D/g, "");
        if (tel.length >= 9) {
          tel = `(${tel.slice(0,3)}) ${tel.slice(3,6)}-${tel.slice(6,9)}`;
        }

        const canal = guild.channels.cache.get(CANAL_REGISTRO_ID);

        const mensagem =
`📋 **NOVO REGISTRO**

\`\`\`yaml
👤 NOME:        ${nome.toUpperCase()}
🆔 PASSAPORTE:  ${id.toUpperCase()}
📱 TELEFONE:    ${tel}
🌑 DEEP:        ${deep}
🏷️ VULGO:       ${vulgo}
\`\`\``;

        await canal.send({ content: mensagem });

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

// PAINEL
client.once(Events.ClientReady, async () => {
  const canal = client.channels.cache.get(CANAL_CADASTRO_ID);

  const embed = new EmbedBuilder()
    .setTitle("📦 Sistema de Registro LAUREA")
    .setDescription("Clique no botão abaixo para se registrar.")
    .setColor("Green");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_registro")
      .setLabel("Fazer Registro")
      .setStyle(ButtonStyle.Success)
  );

  await canal.send({ embeds: [embed], components: [row] });
});

client.login(TOKEN);