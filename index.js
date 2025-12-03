console.log("index.js startet...");
require("dotenv").config();

const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; 
const GUILD_ID = process.env.GUILD_ID;   

// Rolle hier eintragen
const ROLE_ID = "1444999584991543317";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ---------------------------
// Slash-Command registrieren
// ---------------------------

const commands = [
    new SlashCommandBuilder()
        .setName("abmeldung")
        .setDescription("Meldet dich für 24 Stunden ab.")
        .addStringOption(option =>
            option
                .setName("grund")
                .setDescription("Warum meldest du dich ab?")
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Lade Slash-Commands...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("Slash-Commands erfolgreich geladen.");
    } catch (error) {
        console.error(error);
    }
})();

// ---------------------------
// BOT START
// ---------------------------

client.on("ready", () => {
    console.log(`Bot ist eingeloggt als: ${client.user.tag}`);
});

// ---------------------------
// /abmeldung COMMAND
// ---------------------------

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "abmeldung") {
        const grund = interaction.options.getString("grund");
        const member = interaction.member;

        await member.roles.add(ROLE_ID);

        await interaction.reply({
            content: `Du wurdest erfolgreich abgemeldet.\n**Grund:** ${grund}\nDie Rolle wird in **24 Stunden** automatisch entfernt.`,
            ephemeral: true
        });

        setTimeout(async () => {
            const guildMember = await interaction.guild.members.fetch(member.id).catch(() => null);

            if (guildMember && guildMember.roles.cache.has(ROLE_ID)) {
                await guildMember.roles.remove(ROLE_ID);

                try {
                    await guildMember.send("📢 Deine Abmeldung ist abgelaufen. Die Rolle wurde entfernt.");
                } catch (err) {
                    console.log("Konnte keine DM schicken.");
                }
            }
        }, 24 * 60 * 60 * 1000);
    }
});

client.login(TOKEN);
