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
import MovieRequester from '../utils/movieRequester.js';
import Consumed from '../entities/consumed.js';
import BotDataSource from '../dataSource.js';
import UserInteraction from '../types/userInteraction.js';
import Review from '../entities/review.js';
import moment from 'moment';
import Entertainment from '../types/entertainment.js';
import EntertainmentType, {
  getRequester,
  getStrings,
} from '../types/entertainmentType.js';

async function sendDetailedEmbed(
  interaction: UserInteraction,
  item: Entertainment | number,
  type?: EntertainmentType
) {
  if (typeof item === 'number' && type) {
    item = await getRequester(type).getById(item);
  }

  if (item instanceof Entertainment && item.type === EntertainmentType.Movie) {
    item = await MovieRequester.getInstance().getById(item.id);
  }

  if (!(item instanceof Entertainment)) {
    interaction.followUp("Impossible de trouver l'article.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(item.title)
    .setColor(Colors.DarkAqua)
    .setThumbnail(item.full_image_path)
    .setDescription(item.overview)
    .setFields({
      name: 'Date de sortie',
      value: item.release_date.toLocaleDateString('fr-CA'),
    })
    .setFooter({ text: item.formatted_genres });

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

  addDetailedButtonInteractions(interaction, message, item);
}

function addDetailedButtonInteractions(
  interaction: UserInteraction,
  message: Message<boolean>,
  movie: Entertainment
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
        content: await markItemAsSeen(interaction, movie),
      });
    } else if (buttonInteraction.customId === 'rate') {
      const message = await buttonInteraction.deferReply({
        ephemeral: true,
        fetchReply: true,
      });
      await rateItem(buttonInteraction, message, movie);
    } else if (buttonInteraction.customId === 'review') {
      await reviewItem(buttonInteraction, movie);
    } else if (buttonInteraction.customId === 'schedule') {
      await scheduleItem(buttonInteraction, movie);
    }
  });
}

async function markItemAsSeen(
  interaction: UserInteraction,
  item: Entertainment
): Promise<string> {
  const newConsumed = new Consumed();
  newConsumed.title = item.title;
  newConsumed.item_id = item.id;
  newConsumed.type = item.type;
  newConsumed.user_id = interaction.user.id;

  let response: string = '';

  await BotDataSource.mongoManager.updateOne(
    Consumed,
    { user_id: interaction.user.id, type: item.type, item_id: item.id },
    {
      $setOnInsert: {
        ...newConsumed,
      },
    },
    { upsert: true }
  );

  response = `Vous avez maintenant ${getStrings(item.type).get('consumed')} ${
    item.title
  }.`;

  return response;
}

async function rateItem(
  interaction: UserInteraction,
  message: Message<boolean>,
  item: Entertainment
) {
  if (
    !(await BotDataSource.mongoManager.findOne(Consumed, {
      where: {
        item_id: item.id,
        type: item.type,
        user_id: interaction.user.id,
      },
    }))
  ) {
    interaction.editReply({
      content: `Vous devez ${getStrings(item.type).get(
        'mustConsumeBeforeReview'
      )} avant de faire une évaluation.`,
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
    content: `Donnez une note à ${item.title}`,
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
          item_id: item.id,
          user_id: selectInteraction.user.id,
          type: item.type,
        },
        {
          $set: {
            rating: rating,
          },
          $setOnInsert: {
            user_id: interaction.user.id,
            type: item.type,
            item_id: item.id,
            title: item.title,
            genres: item.genres,
          },
        },
        { upsert: true }
      );

      selectInteraction.editReply({
        content: `Vous avez donné une note de ${rating} à « ${item.title} ».`,
        components: [],
      });
    }
  );
}

async function reviewItem(interaction: UserInteraction, item: Entertainment) {
  const modal = new ModalBuilder()
    .setTitle(item.formatted_title)
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
    submitted.reply(`Vous avez laissé une critique à « ${item.title} ».`);
    const reviewText = submitted.fields.getTextInputValue('reviewText');

    await BotDataSource.manager.getMongoRepository(Review).updateOne(
      {
        user_id: interaction.user.id,
        type: item.type,
        item_id: item.id,
      },
      {
        $set: {
          review: reviewText,
        },
        $setOnInsert: {
          user_id: interaction.user.id,
          type: item.type,
          item_id: item.id,
          title: item.title,
          genres: item.genres,
        },
      },
      {
        upsert: true,
      }
    );
  }
}

async function scheduleItem(interaction: UserInteraction, item: Entertainment) {
  const modal = new ModalBuilder()
    .setTitle(item.formatted_title)
    .setCustomId('movieScheduler');

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setLabel(`Date de ${getStrings(item.type).get('schedule')}`)
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
          type: item.type,
          item_id: item.id,
          scheduled_date: {
            $exists: false,
          },
        },
      })
    ) {
      submitted.editReply(
        `Vous avez déjà ${getStrings(item.type).get('consumed')} ce film.`
      );
      return;
    }

    await BotDataSource.mongoManager.updateOne(
      Consumed,
      {
        user_id: interaction.user.id,
        item_id: item.id,
        type: item.type,
      },
      {
        $set: {
          scheduled_date: date,
        },
        $setOnInsert: {
          title: item.title,
          user_id: interaction.user.id,
          item_id: item.id,
          type: item.type,
        },
      },
      { upsert: true }
    );

    moment().locale('fr');

    submitted.editReply(
      `Vous avez planifié le ${getStrings(item.type).get('schedule')} de ${
        item.title
      } le ${date.format('YYYY-MM-DD')}`
    );
  }
}

export default sendDetailedEmbed;
