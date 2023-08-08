import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Message,
  ModalBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import DetailedMovie from '../models/detailedMovie.js';
import MovieRequester from '../utils/movieRequester.js';
import Consumed from '../entities/consumed.js';
import BotDataSource from '../dataSource.js';
import UserInteraction from '../types/UserInteraction.js';
import Movie from '../models/movie.js';
import Review from '../entities/review.js';
import moment from 'moment';

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
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('review')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('schedule')
      .setEmoji('📅')
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
    if (buttonInteraction.customId === 'markAsSeen') {
      await buttonInteraction.deferReply({
        ephemeral: true,
      });
      buttonInteraction.editReply({
        content: await markMovieAsSeen(interaction, movie),
      });
    } else if (buttonInteraction.customId === 'rate') {
      const message = await buttonInteraction.deferReply({
        ephemeral: true,
        fetchReply: true,
      });
      await rateMovie(buttonInteraction, message, movie);
    } else if (buttonInteraction.customId === 'review') {
      await reviewMovie(buttonInteraction, movie);
    } else if (buttonInteraction.customId === 'schedule') {
      await scheduleMovie(buttonInteraction, movie);
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

  await BotDataSource.mongoManager.updateOne(
    Consumed,
    { user_id: interaction.user.id, type: 'movie', item_id: movie.id },
    {
      $setOnInsert: {
        ...newConsumed,
      },
    },
    { upsert: true }
  );

  response = `Vous avez maintenant visionné ${movie.title}.`;

  return response;
}

async function rateMovie(
  interaction: UserInteraction,
  message: Message<boolean>,
  movie: DetailedMovie
) {
  if (
    !(await BotDataSource.mongoManager.findOne(Consumed, {
      where: {
        item_id: movie.id,
        type: 'movie',
        user_id: interaction.user.id,
      },
    }))
  ) {
    interaction.editReply({
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

  await interaction.editReply({
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

      await BotDataSource.mongoManager.updateOne(
        Review,
        {
          item_id: movie.id,
          user_id: selectInteraction.user.id,
          type: 'movie',
        },
        {
          $set: {
            rating: rating,
          },
          $setOnInsert: {
            user_id: interaction.user.id,
            type: 'movie',
            item_id: movie.id,
            title: movie.title,
            genres: movie.genres.map((x) => x.name),
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

async function reviewMovie(interaction: UserInteraction, movie: DetailedMovie) {
  const modal = new ModalBuilder()
    .setTitle(movie.formatted_title)
    .setCustomId('reviewModal');

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId('reviewText')
      .setLabel('Critique')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph)
  );

  modal.addComponents(actionRow);

  await interaction.showModal(modal);

  const filter = (modalInteraction: ModalSubmitInteraction) =>
    modalInteraction.user.id === interaction.user.id;

  const submitted = await interaction.awaitModalSubmit({
    dispose: true,
    time: 480_000, // 8 minutes
    filter,
  });

  if (submitted) {
    submitted.reply(`Vous avez laissé une critique à « ${movie.title} ».`);
    const reviewText = submitted.fields.getTextInputValue('reviewText');

    await BotDataSource.manager.getMongoRepository(Review).updateOne(
      {
        user_id: interaction.user.id,
        type: 'movie',
        item_id: movie.id,
      },
      {
        $set: {
          review: reviewText,
        },
        $setOnInsert: {
          user_id: interaction.user.id,
          type: 'movie',
          item_id: movie.id,
          title: movie.title,
          genres: movie.genres.map((x) => x.name),
        },
      },
      {
        upsert: true,
      }
    );
  }
}

async function scheduleMovie(
  interaction: UserInteraction,
  movie: DetailedMovie
) {
  const modal = new ModalBuilder()
    .setTitle(movie.formatted_title)
    .setCustomId('movieScheduler');

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setLabel('Date de visionnement')
      .setPlaceholder('aaaa-mm-jj')
      .setCustomId('scheduledDate')
      .setStyle(TextInputStyle.Short)
  );

  modal.addComponents(actionRow);

  interaction.showModal(modal);

  const filter = (modalInteraction: ModalSubmitInteraction) =>
    modalInteraction.user.id === interaction.user.id;

  const submitted = await interaction.awaitModalSubmit({
    dispose: true,
    time: 60_000,
    filter,
  });

  if (submitted) {
    await submitted.deferReply({ ephemeral: true });
    const date = moment(
      submitted.fields.getTextInputValue('scheduledDate'),
      'YYYY-MM-DD'
    );

    // Si la date est invalide
    if (!date.isValid()) {
      submitted.editReply('Le format de date fourni est invalide.');
      return;
    }

    // Si le film est déjà visionné
    if (
      await BotDataSource.mongoManager.findOne(Consumed, {
        where: {
          user_id: interaction.user.id,
          type: 'movie',
          item_id: movie.id,
          scheduled_date: {
            $exists: false,
          },
        },
      })
    ) {
      submitted.editReply('Vous avez déjà visionné ce film.');
      return;
    }

    await BotDataSource.mongoManager.updateOne(
      Consumed,
      {
        user_id: interaction.user.id,
        item_id: movie.id,
        type: 'movie',
      },
      {
        $set: {
          scheduled_date: date,
        },
        $setOnInsert: {
          title: movie.title,
          user_id: interaction.user.id,
          item_id: movie.id,
          type: 'movie',
        },
      },
      { upsert: true }
    );

    moment().locale('fr');

    submitted.editReply(
      `Vous avez planifié le visionnement de ${movie.title} le ${date.format(
        'YYYY-MM-DD'
      )}`
    );
  }
}

export default sendDetailedMovieEmbed;
