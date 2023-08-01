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

type Direction = 'right' | 'left';

const PAGE_SIZE = 5;

const SearchMovies: Command = {
  data: new SlashCommandBuilder()
    .setName('recherchefilm')
    .addStringOption((options) =>
      options
        .setName('requete')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    const message = await interaction.deferReply({
      fetchReply: true,
      ephemeral: true,
    });

    const query = interaction.options.get('requete').value.toString();
    const { MOVIE_TOKEN } = process.env;

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

    let offset: number = 0;

    const embed = generateSearchEmbed(results, query, offset);

    await interaction.editReply({
      embeds: [embed],
      components: [
        generateNumbersRow(results, offset),
        generateArrowsRow(results, offset),
      ],
    });

    const addButtonListener = () => {
      const filter = (click: ButtonInteraction<'cached'>): boolean => {
        return click.user.id === interaction.user.id;
      };

      const collector = message.channel.createMessageComponentCollector({
        filter,
        max: 1,
      });

      collector.on(
        'collect',
        async (buttonInteraction: ButtonInteraction<'cached'>) => {
          await buttonInteraction.deferUpdate();
          if (!isNaN(+buttonInteraction.customId)) {
            const index: number = +buttonInteraction.customId;
            sendDetailedMovieEmbed(interaction, results[index + offset]);
            return;
          }
          changeOffset(
            buttonInteraction.customId as Direction,
            buttonInteraction
          );
        }
      );
    };

    addButtonListener();

    const changeOffset = (
      direction: Direction,
      buttonInteraction: ButtonInteraction<'cached'>
    ) => {
      offset += direction === 'left' ? -PAGE_SIZE : PAGE_SIZE;
      offset = Math.min(results.length, Math.max(0, offset));
      const embed = generateSearchEmbed(results, query, offset);

      buttonInteraction.update({
        embeds: [embed],
        components: [
          generateNumbersRow(results, offset),
          generateArrowsRow(results, offset),
        ],
      });

      addButtonListener();
    };
  },
};

function addFields(embed: EmbedBuilder, movies: Movie[], offset: number) {
  // Ajoute les films au message
  movies.slice(offset, offset + PAGE_SIZE).forEach((movie, index) => {
    embed.addFields({
      name: `${index + 1} - ${movie.title}`,
      value: movie.formatted_overview,
    });
  });
  embed.addFields({
    name: 'Résultats',
    value: `${Math.min(offset + 5, movies.length)}/${movies.length}`,
  });
}

function generateSearchEmbed(
  movies: Movie[],
  query: string,
  offset: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Recherche de films '${query}'`)
    .setColor(Colors.DarkAqua);

  addFields(embed, movies, offset);

  return embed;
}

function generateNumbersRow(
  movies: Movie[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const numbers: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('0')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[offset] === undefined)
      .setEmoji('1️⃣'),
    new ButtonBuilder()
      .setCustomId('1')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[1 + offset] === undefined)
      .setEmoji('2️⃣'),
    new ButtonBuilder()
      .setCustomId('2')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[2 + offset] === undefined)
      .setEmoji('3️⃣'),
    new ButtonBuilder()
      .setCustomId('3')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[3 + offset] === undefined)
      .setEmoji('4️⃣'),
    new ButtonBuilder()
      .setCustomId('4')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(movies[4 + offset] === undefined)
      .setEmoji('5️⃣'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...numbers);
}

function generateArrowsRow(
  movies: Movie[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const arrows: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('left')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset === 0)
      .setEmoji('◀️'),
    new ButtonBuilder()
      .setCustomId('right')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset + PAGE_SIZE >= movies.length)
      .setEmoji('▶️'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...arrows);
}

function sendDetailedMovieEmbed(interaction: CommandInteraction, movie: Movie) {
  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setThumbnail(movie.full_poster_path)
    .setDescription(movie.overview)
    .setFields({
      name: 'Date de sortie',
      value: movie.release_date.toLocaleDateString('fr-CA'),
    });

  interaction.followUp({
    embeds: [embed],
  });
}

export default SearchMovies;
