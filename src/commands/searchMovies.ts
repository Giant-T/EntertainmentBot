import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Message,
  SlashCommandBuilder,
} from 'discord.js';
import Command from '../models/command.js';
import MovieSearchResult from '../models/movieSearchResult.js';
import Movie from '../models/movie.js';
import DetailedMovie from '../models/detailedMovie.js';
import MovieRequester from '../utils/movieRequester.js';
import BotDataSource from '../dataSource.js';
import Consumed from '../entities/consumed.js';

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

    const { results } = new MovieSearchResult(
      (
        await MovieRequester.get(`search/movie?query=${query}&language=fr-CAN`)
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
            sendDetailedMovieEmbed(interaction, results[index + offset].id);
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

      buttonInteraction.editReply({
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
    value: `${Math.min(offset + PAGE_SIZE, movies.length)}/${movies.length}`,
  });
}

function generateSearchEmbed(
  movies: Movie[],
  query: string,
  offset: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Recherche de films '${query}'`)
    .setColor(Colors.DarkBlue);

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

async function sendDetailedMovieEmbed(
  interaction: CommandInteraction,
  movieId: number
) {
  const movie = new DetailedMovie(
    (await MovieRequester.get(`movie/${movieId}?language=fr-CAN`)).data
  );

  const embed = new EmbedBuilder()
    .setTitle(movie.title)
    .setColor(Colors.DarkAqua)
    .setThumbnail(movie.full_poster_path)
    .setDescription(movie.overview)
    .setFields({
      name: 'Date de sortie',
      value: movie.release_date.toLocaleDateString('fr-CA'),
    })
    .setFooter({ text: movie.formatted_genres });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('markAsSeen')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Primary)
  );

  const message = await interaction.followUp({
    embeds: [embed],
    components: [actionRow],
    fetchReply: true,
  });

  addDetailedButtonInteractions(interaction, message, movie);
}

function addDetailedButtonInteractions(
  interaction: CommandInteraction,
  message: Message<boolean>,
  movie: DetailedMovie
) {
  const filter = (click: ButtonInteraction<'cached'>): boolean => {
    return (
      click.user.id === interaction.user.id && click.customId === 'markAsSeen'
    );
  };

  const collector = message.channel.createMessageComponentCollector({
    filter,
    max: 1,
  });

  collector.on(
    'collect',
    async (buttonInteraction: ButtonInteraction<'cached'>) => {
      await buttonInteraction.deferUpdate();

      const newConsumed = new Consumed();
      newConsumed.title = movie.title;
      newConsumed.consumed_id = movie.id;
      newConsumed.type = 'movie';
      newConsumed.user_id = interaction.user.id;
      newConsumed.user_name = interaction.user.username;

      if (
        (await BotDataSource.manager.getMongoRepository(Consumed).findOne({
          where: {
            consumed_id: movie.id,
            type: 'movie',
            user_id: interaction.user.id,
          },
        })) === null
      )
        await BotDataSource.manager
          .getMongoRepository(Consumed)
          .insertOne(newConsumed);
    }
  );
}

export default SearchMovies;
