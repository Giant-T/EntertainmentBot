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

    const moviesSeen = await BotDataSource.manager
      .getMongoRepository(Consumed)
      .find({ where: { user_id: user.id, type: 'movie' } });

    const embed = new EmbedBuilder()
      .setTitle(`Profil de ${user.username}`)
      .setColor(user.accentColor ?? Colors.DarkAqua)
      .setImage(user.avatarURL() ?? user.defaultAvatarURL)
      .addFields({
        name: 'Nombre de films visionnés:',
        value: moviesSeen.length.toString(),
      });

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setEmoji('👁️')
        .setCustomId('seen')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });

    const filter = (click: ButtonInteraction<'cached'>) =>
      click.user.id === interaction.user.id;

    const collector = message.createMessageComponentCollector({
      max: 1,
      dispose: true,
      time: 45000,
      filter,
    });

    collector.on(
      'collect',
      async (buttonInteraction: ButtonInteraction<'cached'>) => {
        const message = await buttonInteraction.deferReply();

        if (buttonInteraction.customId === 'seen') {
          sendPager(
            buttonInteraction,
            message,
            moviesSeen,
            `Films vus par ${user.username}`,
            (value, index) => ({
              name: (index + 1).toString(),
              value: value.title,
            }),
            (interaction, value) =>
              sendDetailedMovieEmbed(interaction, value.consumed_id)
          );
        }
      }
    );
  },
};

export default Profile;
