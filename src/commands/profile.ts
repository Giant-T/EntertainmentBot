import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import Command from '../models/command.js';
import BotDataSource from '../dataSource.js';
import Consumed from '../entities/consumed.js';

const Profile: Command = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .addUserOption((options) =>
      options.setName('utilisateur').setDescription("L'utilisateur cible")
    )
    .setDescription("Voir le profil d'un utilisateur."),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('utilisateur') ?? interaction.user;

    const numberOfMoviesSeen = await BotDataSource.manager
      .getMongoRepository(Consumed)
      .count({ user_id: user.id, type: 'movie' });

    const embed = new EmbedBuilder()
      .setTitle(`Profil de ${user.username}`)
      .setColor(user.accentColor ?? Colors.DarkAqua)
      .setImage(user.avatarURL() ?? user.defaultAvatarURL)
      .addFields({
        name: 'Nombre de films visionnés:',
        value: numberOfMoviesSeen.toString(),
      });

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setEmoji('👁️')
        .setCustomId('seen')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [actionRow] });
  },
};

export default Profile;
