import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import Command from '../models/command.js';
import axios from 'axios';
import MovieSearchResult from '../models/movieSearchResult.js';
import Movie from '../models/movie.js';

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
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    const message = await interaction.deferReply({ fetchReply: true });

    const query = interaction.options.get('query').value;
    const { MOVIE_TOKEN } = process.env;

    const arrows: ButtonBuilder[] = [
      new ButtonBuilder()
        .setCustomId('left')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀️'),
      new ButtonBuilder()
        .setCustomId('right')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('▶️'),
    ];

    const arrowsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...arrows
    );

    const { results } = new MovieSearchResult(
      (
        await axios.get(
          `https://api.themoviedb.org/3/search/movie?query=${query}&language=fr-CAN`,
          {
            headers: {
              Authorization: `Bearer ${MOVIE_TOKEN}`,
            },
          }
        )
      ).data
    );

    const numbers: ButtonBuilder[] = [
      new ButtonBuilder()
        .setCustomId('0')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1️⃣'),
      new ButtonBuilder()
        .setCustomId('1')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('2️⃣'),
      new ButtonBuilder()
        .setCustomId('2')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('3️⃣'),
      new ButtonBuilder()
        .setCustomId('3')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('4️⃣'),
      new ButtonBuilder()
        .setCustomId('4')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('5️⃣'),
    ];

    const numbersRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...numbers
    );

    const embed = new EmbedBuilder()
      .setTitle(`Recherche de films '${query}'`)
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

    await interaction.editReply({
      embeds: [embed],
      components: [numbersRow, arrowsRow],
    });

    const filter = (click: ButtonInteraction<'cached'>): boolean =>
      click.user.id === interaction.user.id;

    const collector = message.channel.createMessageComponentCollector({
      filter,
      max: 1,
    });

    collector.on(
      'collect',
      (buttonInteraction: ButtonInteraction<'cached'>) => {
        if (!isNaN(+buttonInteraction.customId)) {
          const index: number = +buttonInteraction.customId;
          sendDetailedMovieEmbed(buttonInteraction, results[index]);
        }
      }
    );
  },
};

function sendDetailedMovieEmbed(
  interaction: ButtonInteraction<'cached'>,
  movie: Movie
) {
  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setThumbnail(movie.full_poster_path)
    .setDescription(movie.overview)
    .setFields({
      name: 'Date de sortie',
      value: movie.release_date.toLocaleDateString('fr-CA'),
    });

  interaction.reply({
    embeds: [embed],
  });
}

export default SearchMovies;
