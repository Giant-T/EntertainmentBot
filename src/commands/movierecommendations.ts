import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../models/command.js';
import sendPager from '../embeds/pager.js';
import Review from '../entities/review.js';
import sendDetailedEmbed from '../embeds/detailedEmbed.js';
import BotDataSource from '../dataSource.js';
import { Document } from 'typeorm';

// Recommande un film à l'utilisateur selon les films apprécié par un autre utilisateur
const MovieRecommendations: Command = {
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
    await interaction.deferReply();
    const user = interaction.options.getUser('utilisateur', true);

    const genresWithScores: Document[] = [
      {
        $match: {
          user_id: interaction.user.id,
          type: 'movie',
          rating: { $ne: null },
        },
      },
      {
        $unwind: '$genres',
      },
      {
        $group: {
          _id: '$genres',
          score: { $sum: '$rating' },
        },
      },
    ];

    // Requete de recommendations
    // En fonction des genres aimés et de la note donnée par l'autre utilisateur
    const recommendations: Review[] = await BotDataSource.mongoManager
      .aggregate(Review, [
        {
          $match: {
            rating: { $ne: null },
          },
        },
        {
          $lookup: {
            from: 'review',
            pipeline: genresWithScores,
            as: 'genresScores',
          },
        },
        {
          $project: {
            title: 1,
            genres: 1,
            item_id: 1,
            type: 1,
            rating: 1,
            genresScores: {
              $filter: {
                input: '$genresScores',
                as: 'genreScore',
                cond: { $in: ['$$genreScore._id', '$genres'] },
              },
            },
            score: {
              // Multiplie le score des genres par la note donnée au film
              $multiply: [
                {
                  $sum: {
                    // Map le score du film
                    $map: {
                      input: {
                        $filter: {
                          // Filtre les genres du film
                          input: '$genresScores',
                          as: 'genreScore',
                          cond: { $in: ['$$genreScore._id', '$genres'] },
                        },
                      },
                      as: 'genreScore',
                      in: '$$genreScore.score',
                    },
                  },
                },
                '$rating',
              ],
            },
          },
        },
        {
          $sort: {
            score: -1,
          },
        },
      ])
      .toArray();

    sendPager(
      interaction,
      recommendations,
      `Recommandations de ${user.username}`,
      (value, index) => ({
        name: `${index + 1} - ${value.title}`,
        value: `L'utilisateur a donné une note de ${value.rating}.`,
      }),
      (interaction, value) => {
        sendDetailedEmbed(interaction, value.item_id);
      }
    );
  },
};

export default MovieRecommendations;
