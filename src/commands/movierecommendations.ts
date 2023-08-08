import { CommandInteraction, Message, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import sendPager from '../embeds/pager.js';
import Review from '../entities/review.js';
import sendDetailedMovieEmbed from '../embeds/detailedMovieEmbed.js';

const Movierecommendations: Command = {
  data: new SlashCommandBuilder()
    .setName('recommandationfilm')
    .addUserOption((options) =>
      options
        .setName('utilisateur')
        .setDescription('Utilisateur qui recommande les films.')
        .setRequired(true)
    )
    .setDescription("Recommandation d'un autre utilisateur."),
  async execute(interaction: CommandInteraction) {
    const message: Message = await interaction.deferReply({
      fetchReply: true,
    });
    const user = interaction.options.getUser('utilisateur', true);

    sendPager<Review>(
      interaction,
      [],
      `Recommandations de ${user.username}`,
      (value, index) => ({
        name: `${index} - ${value.title}`,
        value: `L'utilisateur a donné une note de ${value.rating}.`,
      }),
      (interaction, value) => {
        sendDetailedMovieEmbed(interaction, value.item_id);
      }
    );
  },
};

export default Movierecommendations;
