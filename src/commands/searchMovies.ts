import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import MovieSearchResult from '../models/movieSearchResult.js';
import MovieRequester from '../utils/movieRequester.js';
import sendMovieListEmbed from '../embeds/movieListEmbed.js';

const SearchMovies: Command = {
  data: new SlashCommandBuilder()
    .setName('recherchefilm')
    .addStringOption((options) =>
      options
        .setName('requete')
        .setDescription('Requête de recherche')
        .setRequired(true)
    )
    .setDescription('Recherche de film'),
  async execute(interaction: CommandInteraction) {
    const message = await interaction.deferReply({
      fetchReply: true,
      ephemeral: true,
    });

    const query = interaction.options.get('requete').value.toString();

    const { results } = new MovieSearchResult(
      (
        await MovieRequester.get(`search/movie?query=${query}&language=fr-CAN`)
      ).data
    );

    sendMovieListEmbed(
      interaction,
      message,
      results,
      `Recherche de films '${query}'`
    );
  },
};

export default SearchMovies;
