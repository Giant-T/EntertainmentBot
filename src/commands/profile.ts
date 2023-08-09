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
import BotDataSource from '../dataSource.js';
import Consumed from '../entities/consumed.js';
import sendPager from '../embeds/pager.js';
import sendDetailedEmbed from '../embeds/detailedEmbed.js';
import Review from '../entities/review.js';
import sendReviewEmbed from '../embeds/reviewEmbed.js';
import EntertainmentType from '../types/entertainmentType.js';

// Retourne le profile d'un utilisateur
const Profile: Command = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .addUserOption((options) =>
      options.setName('utilisateur').setDescription("L'utilisateur cible")
    )
    .setDescription("Voir le profil d'un utilisateur."),
  async execute(interaction: CommandInteraction) {
    const message = await interaction.deferReply();
    const user = interaction.options.getUser('utilisateur') ?? interaction.user;

    const moviesSeen = await BotDataSource.mongoManager.find(Consumed, {
      where: {
        user_id: user.id,
        type: EntertainmentType.Movie,
        scheduled_date: { $exists: false },
      },
      order: { title: 1 },
    });
    const reviewedMovies = await BotDataSource.mongoManager.find(Review, {
      where: {
        user_id: user.id,
        type: EntertainmentType.Movie,
      },
      order: { title: 1 },
    });

    const playedGames = await BotDataSource.mongoManager.find(Consumed, {
      where: {
        user_id: user.id,
        type: EntertainmentType.VideoGame,
        scheduled_date: { $exists: false },
      },
      order: { title: 1 },
    });
    const reviewedGames = await BotDataSource.mongoManager.find(Review, {
      where: {
        user_id: user.id,
        type: EntertainmentType.VideoGame,
      },
      order: { title: 1 },
    });

    const embed = new EmbedBuilder()
      .setTitle(`Profil de ${user.username}`)
      .setColor(user.accentColor ?? Colors.DarkAqua)
      .setImage(user.avatarURL() ?? user.defaultAvatarURL)
      .addFields(
        {
          name: 'Nombre de films visionnés:',
          value: moviesSeen.length.toString(),
        },
        {
          name: "Nombre d'évaluation de films:",
          value: reviewedMovies.length.toString(),
        },
        {
          name: 'Nombre de jeu joués:',
          value: playedGames.length.toString(),
        },
        {
          name: "Nombre d'évaluation de jeux:",
          value: reviewedGames.length.toString(),
        }
      );

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('👁️🎬')
        .setCustomId('seen')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('⭐🎬')
        .setCustomId('reviewedMovies')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('👁️🕹️')
        .setCustomId('played')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel('⭐🕹️')
        .setCustomId('reviewedGames')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });

    const filter = (click: ButtonInteraction) =>
      click.user.id === interaction.user.id;

    const collector = message.createMessageComponentCollector({
      max: 1,
      time: 45000,
      filter,
    });

    collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
      await buttonInteraction.deferReply();

      if (buttonInteraction.customId === 'seen') {
        sendPager(
          buttonInteraction,
          moviesSeen,
          `Films vus par ${user.username}`,
          (value, index) => ({
            name: (index + 1).toString(),
            value: value.title,
          }),
          (interaction, value) =>
            sendDetailedEmbed(interaction, value.item_id, value.type)
        );
      } else if (buttonInteraction.customId === 'reviewedMovies') {
        sendPager(
          buttonInteraction,
          reviewedMovies,
          `Films évalués par ${user.username}`,
          (value, index) => ({
            name: `${index + 1} - ${value.title}`,
            value: value.rating
              ? `Vous avez donné une note de ${value.rating}.`
              : "Vous n'avez pas donné de note à ce film",
          }),
          (interaction, value) =>
            sendReviewEmbed(interaction, value, user.username)
        );
      } else if (buttonInteraction.customId === 'played') {
        sendPager(
          buttonInteraction,
          playedGames,
          `Jeux joués par ${user.username}`,
          (value, index) => ({
            name: (index + 1).toString(),
            value: value.title,
          }),
          (interaction, value) =>
            sendDetailedEmbed(interaction, value.item_id, value.type)
        );
      } else if (buttonInteraction.customId === 'reviewedGames') {
        sendPager(
          buttonInteraction,
          reviewedGames,
          `Jeux évalués par ${user.username}`,
          (value, index) => ({
            name: `${index + 1} - ${value.title}`,
            value: value.rating
              ? `Vous avez donné une note de ${value.rating}.`
              : "Vous n'avez pas donné de note à ce jeu",
          }),
          (interaction, value) =>
            sendReviewEmbed(interaction, value, user.username)
        );
      }
    });
  },
};

export default Profile;
