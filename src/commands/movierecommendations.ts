import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import sendPager from '../embeds/pager.js';

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
    const message = await interaction.deferReply({
      fetchReply: true,
    });
    const user = interaction.options.getUser('utilisateur', true);

    sendPager(
      interaction,
      message,
      [],
      `Recommandations de ${user.username}`,
      (value, index) => ({ name: '', value: '' }),
      (interaction, value) => {}
    );
  },
};

export default Movierecommendations;
