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
import axios from 'axios';
import MovieSearchResult from '../models/movieSearchResult.js';

// Commande qui retourne un mockup de la liste des films à l'utilisateur
const SearchMovies: Command = {
  data: new SlashCommandBuilder()
    .setName('searchmovies')
    .addStringOption((options) =>
      options
        .setName('query')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .addStringOption((options) =>
      options
        .setName('language')
        .setDescription('Langage des informations')
        .addChoices(
          { name: 'Français', value: 'fr-CAN' },
          { name: 'English', value: 'en-CAN' }
        )
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    const query = interaction.options.get('query').value;
    const language =
      interaction.options.get('language', false)?.value ?? 'fr-CAN';
    console.log(language);
    const { MOVIE_TOKEN } = process.env;

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

    const { results } = (
      await axios.get<MovieSearchResult>(
        `https://api.themoviedb.org/3/search/movie?query=${query}&language${language}`,
        {
          headers: {
            Authorization: `Bearer ${MOVIE_TOKEN}`,
          },
        }
      )
    ).data;

    const embed = new EmbedBuilder()
      .setTitle('Liste des films')
      .setColor(Colors.DarkAqua);

    // Ajoute les films au message
    results.slice(0, 5).forEach((movie, index) => {
      embed.addFields({
        name: `${index + 1} - ${movie.title}`,
        value:
          movie.overview.length > 1024
            ? movie.overview.slice(0, 1023) + '&hellip;'
            : movie.overview,
      });
    });

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // Ajoute les réactions 1, 2, 3... sous le message
    message
      .react('1️⃣')
      .then(() => message.react('2️⃣'))
      .then(() => message.react('3️⃣'))
      .then(() => message.react('4️⃣'))
      .then(() => message.react('5️⃣'));
  },
};

export default SearchMovies;
