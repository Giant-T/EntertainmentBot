import { EmbedBuilder } from 'discord.js';
import Review from '../entities/review.js';
import UserInteraction from '../types/UserInteraction.js';

export default function sendReviewEmbed(
  interaction: UserInteraction,
  review: Review,
  username: string
) {
  const embed = new EmbedBuilder()
    .setTitle(`Critique de ${review.title}`)
    .setColor('DarkAqua')
    .setAuthor({ name: username })
    .setDescription(review.review ?? "L'utilisateur n'as pas fait de critique.")
    .addFields({
      name: 'Note',
      value: review.rating?.toString() ?? 'Aucune note.',
    })
    .setFooter({ text: review.formatted_genres });

  interaction.followUp({ embeds: [embed] });
}
