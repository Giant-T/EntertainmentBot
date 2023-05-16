import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import Command from '../models/command.js';
import Movie, { randomMovie } from '../models/movie.js';

const Testbuttons: Command = {
  data: new SlashCommandBuilder()
    .setName('testbuttons')
    .setDescription('Test des boutons'),
  async execute(interaction: CommandInteraction) {
    const buttons: ButtonBuilder[] = [
      new ButtonBuilder()
        .setCustomId('left')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀️'),
      new ButtonBuilder()
        .setCustomId('right')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('▶️'),
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

    const movies: Movie[] = [
      randomMovie(),
      randomMovie(),
      randomMovie(),
      randomMovie(),
      randomMovie(),
    ];

    const embed = new EmbedBuilder()
      .setTitle('Liste des filmes')
      .setColor(Colors.DarkAqua);

    movies.forEach((movie, index) => {
      embed.addFields({
        name: `${index + 1} - ${movie.title}`,
        value: movie.description,
      });
    });

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    message
      .react('1️⃣')
      .then(() => message.react('2️⃣'))
      .then(() => message.react('3️⃣'))
      .then(() => message.react('4️⃣'))
      .then(() => message.react('5️⃣'));
  },
};

export default Testbuttons;