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
import Entertainment from '../models/entertainment.js';
import EntertainmentType, {
  getRequester,
  getStrings,
} from '../types/entertainmentType.js';

/**
 * Envoie un embed détaillé d'un article
 * @param interaction L'interaction de l'utilisateur
 * @param item L'article ou l'id de l'article
 * @param type Le type de l'article si on fournit seulement un id
 */
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
      .setCustomId('consume')
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

/**
 * Ajoute les interactions des boutons
 * @param interaction L'interaction de l'utilisateur
 * @param message Le message envoyé par le bot
 * @param item L'article de l'embed
 */
function addDetailedButtonInteractions(
  interaction: UserInteraction,
  message: Message<boolean>,
  item: Entertainment
) {
  const filter = (click: ButtonInteraction): boolean => {
    return click.user.id === interaction.user.id;
  };

  const collector = message.createMessageComponentCollector({
    filter,
    time: 45000,
  });

  collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
    if (buttonInteraction.customId === 'consume') {
      await buttonInteraction.deferReply({
        ephemeral: true,
      });
      buttonInteraction.editReply({
        content: await consumeItem(interaction, item),
      });
    } else if (buttonInteraction.customId === 'rate') {
      const message = await buttonInteraction.deferReply({
        ephemeral: true,
        fetchReply: true,
      });
      await rateItem(buttonInteraction, message, item);
    } else if (buttonInteraction.customId === 'review') {
      await reviewItem(buttonInteraction, item);
    } else if (buttonInteraction.customId === 'schedule') {
      await scheduleItem(buttonInteraction, item);
    }
  });
}

/**
 * Indique la consommation d'un article
 * @param interaction L'interaction de l'utilisateur
 * @param item L'article à consommer
 * @returns Un message indiquant la réussite
 */
async function consumeItem(
  interaction: UserInteraction,
  item: Entertainment
): Promise<string> {
  const newConsumed = new Consumed();
  newConsumed.title = item.title;
  newConsumed.item_id = item.id;
  newConsumed.type = item.type;
  newConsumed.user_id = interaction.user.id;

  let response: string = '';

  // Ajoute la consommation et retire la date prévue si la consommation existait
  await BotDataSource.mongoManager.updateOne(
    Consumed,
    { user_id: interaction.user.id, type: item.type, item_id: item.id },
    {
      $unset: {
        scheduled_date: '',
      },
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

/**
 * Ajoute une note à un article
 * @param interaction L'interaction de l'utilisateur
 * @param message Le message envoyé par le bot
 * @param item L'article à noter
 */
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

  // La selection de notes pour l'utilisateur
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
    filter,
    time: 30000,
    max: 1,
  });

  collector.on(
    'collect',
    async (selectInteraction: StringSelectMenuInteraction) => {
      await selectInteraction.deferUpdate();

      const rating = +selectInteraction.values[0];

      // Ajoute ou modifie la note
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

/**
 * Ajoute une critique à un article
 * @param interaction L'interaction de l'utilisateur
 * @param item L'article à critiquer
 */
async function reviewItem(interaction: UserInteraction, item: Entertainment) {
  if (
    !(await BotDataSource.mongoManager.findOne(Consumed, {
      where: {
        item_id: item.id,
        type: item.type,
        user_id: interaction.user.id,
      },
    }))
  ) {
    interaction.reply({
      ephemeral: true,
      content: `Vous devez ${getStrings(item.type).get(
        'mustConsumeBeforeReview'
      )} avant de faire une évaluation.`,
    });
    return;
  }

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
    time: 480_000, // 8 minutes
    filter,
  });

  if (submitted) {
    submitted.reply(`Vous avez laissé une critique à « ${item.title} ».`);
    const reviewText = submitted.fields.getTextInputValue('reviewText');

    // Ajoute ou modifie la review de l'article
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

/**
 * Ajoute une date de consommation de l'article
 * @param interaction L'interaction de l'utilisateur
 * @param item L'article qui sera consommé par l'utilisateur
 */
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
    time: 60_000, // 1 min
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

    // Si l'article est déjà consommé
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

    // Ajoute une date de consommation
    await BotDataSource.mongoManager.updateOne(
      Consumed,
      {
        user_id: interaction.user.id,
        item_id: item.id,
        type: item.type,
      },
      {
        $set: {
          scheduled_date: date.toDate(),
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
