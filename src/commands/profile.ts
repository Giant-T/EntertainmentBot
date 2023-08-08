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
import sendDetailedMovieEmbed from '../embeds/detailedMovieEmbed.js';
import Review from '../entities/review.js';
import sendReviewEmbed from '../embeds/reviewEmbed.js';

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
        type: 'movie',
        scheduled_date: { $exists: false },
      },
      order: { title: 1 },
    });
    const reviewedMovies = await BotDataSource.mongoManager.find(Review, {
      where: {
        user_id: user.id,
        type: 'movie',
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
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });

    const filter = (click: ButtonInteraction) =>
      click.user.id === interaction.user.id;

    const collector = message.createMessageComponentCollector({
      max: 1,
      dispose: true,
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
            sendDetailedMovieEmbed(interaction, value.item_id)
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
      }
    });
  },
};

export default Profile;
