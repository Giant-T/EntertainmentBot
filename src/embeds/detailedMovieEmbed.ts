import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Message,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import DetailedMovie from '../models/detailedMovie.js';
import MovieRequester from '../utils/movieRequester.js';
import Consumed from '../entities/consumed.js';
import BotDataSource from '../dataSource.js';
import UserInteraction from '../types/UserInteraction.js';
import Movie from '../models/movie.js';
import Review from '../entities/review.js';

async function sendDetailedMovieEmbed(
  interaction: UserInteraction,
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
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('rate')
      .setEmoji('⭐')
      .setStyle(ButtonStyle.Success)
  );

  const message = await interaction.followUp({
    embeds: [embed],
    components: [actionRow],
    fetchReply: true,
  });

  addDetailedButtonInteractions(interaction, message, movie);
}

function addDetailedButtonInteractions(
  interaction: UserInteraction,
  message: Message<boolean>,
  movie: DetailedMovie
) {
  const filter = (click: ButtonInteraction): boolean => {
    return click.user.id === interaction.user.id;
  };

  const collector = message.createMessageComponentCollector({
    filter,
    dispose: true,
    time: 45000,
  });

  collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
    const message = await buttonInteraction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    if (buttonInteraction.customId === 'markAsSeen') {
      buttonInteraction.editReply({
        content: await markMovieAsSeen(interaction, movie),
      });
    } else if (buttonInteraction.customId === 'rate') {
      if (
        !(await BotDataSource.manager.getMongoRepository(Consumed).findOne({
          where: {
            item_id: movie.id,
            type: 'movie',
            user_id: buttonInteraction.user.id,
          },
        }))
      ) {
        buttonInteraction.editReply({
          content: 'Vous devez regarder le film avant de faire une évaluation.',
        });
        return;
      }

      const ratingSelect = new StringSelectMenuBuilder()
        .setCustomId('rating')
        .setPlaceholder('Choisissez une note...')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('1').setValue('1'),
          new StringSelectMenuOptionBuilder().setLabel('2').setValue('2'),
          new StringSelectMenuOptionBuilder().setLabel('3').setValue('3'),
          new StringSelectMenuOptionBuilder().setLabel('4').setValue('4'),
          new StringSelectMenuOptionBuilder().setLabel('5').setValue('5')
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        ratingSelect
      );

      await buttonInteraction.editReply({
        content: `Donnez une note à ${movie.title}`,
        components: [row],
      });

      const filter = (action: AnySelectMenuInteraction) =>
        action.user.id === interaction.user.id && action.customId === 'rating';

      const collector = message.createMessageComponentCollector({
        dispose: true,
        filter,
        time: 30000,
        max: 1,
      });

      collector.on(
        'collect',
        async (selectInteraction: StringSelectMenuInteraction) => {
          await selectInteraction.deferUpdate();

          const rating = +selectInteraction.values[0];

          const review = new Review();
          review.item_id = movie.id;
          review.user_id = selectInteraction.user.id;
          review.genres = movie.genres.map((x) => x.name);
          review.title = movie.title;
          review.rating = rating;
          review.type = 'movie';

          await BotDataSource.manager.getMongoRepository(Review).updateOne(
            {
              item_id: review.item_id,
              user_id: review.user_id,
              type: review.type,
            },
            {
              $set: {
                ...review,
              },
            },
            { upsert: true }
          );

          selectInteraction.editReply({
            content: `Vous avez donné une note de ${rating} à ${movie.title}.`,
            components: [],
          });
        }
      );
    }
  });
}

async function markMovieAsSeen(
  interaction: UserInteraction,
  movie: Movie
): Promise<string> {
  const newConsumed = new Consumed();
  newConsumed.title = movie.title;
  newConsumed.item_id = movie.id;
  newConsumed.type = 'movie';
  newConsumed.user_id = interaction.user.id;

  let response: string = '';

  if (
    (await BotDataSource.manager.getMongoRepository(Consumed).findOne({
      where: {
        item_id: movie.id,
        type: 'movie',
        user_id: interaction.user.id,
      },
    })) === null
  ) {
    await BotDataSource.manager.save(newConsumed);

    response = `Vous avez maintenant visionné ${movie.title}.`;
  } else {
    response = `Vous avez déjà visionné ${movie.title}.`;
  }

  return response;
}

export default sendDetailedMovieEmbed;
