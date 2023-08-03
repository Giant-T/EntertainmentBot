import {
  APIEmbedField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  InteractionResponse,
  Message,
} from 'discord.js';
import UserInteraction from '../types/UserInteraction';

type Direction = 'right' | 'left';
const PAGE_SIZE = 5;

function generateNumbersRow<T>(
  values: T[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const numbers: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('0')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(values[offset] === undefined)
      .setEmoji('1️⃣'),
    new ButtonBuilder()
      .setCustomId('1')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(values[1 + offset] === undefined)
      .setEmoji('2️⃣'),
    new ButtonBuilder()
      .setCustomId('2')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(values[2 + offset] === undefined)
      .setEmoji('3️⃣'),
    new ButtonBuilder()
      .setCustomId('3')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(values[3 + offset] === undefined)
      .setEmoji('4️⃣'),
    new ButtonBuilder()
      .setCustomId('4')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(values[4 + offset] === undefined)
      .setEmoji('5️⃣'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...numbers);
}

function generateArrowsRow<T>(
  values: T[],
  offset: number
): ActionRowBuilder<ButtonBuilder> {
  const arrows: ButtonBuilder[] = [
    new ButtonBuilder()
      .setCustomId('left')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset === 0)
      .setEmoji('◀️'),
    new ButtonBuilder()
      .setCustomId('right')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(offset + PAGE_SIZE >= values.length)
      .setEmoji('▶️'),
  ];

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...arrows);
}

function addFields<T>(
  embed: EmbedBuilder,
  values: T[],
  offset: number,
  row: (value: T, index: number) => APIEmbedField
) {
  values.slice(offset, offset + PAGE_SIZE).forEach((value, index) => {
    embed.addFields(row(value, index));
  });

  embed.addFields({
    name: 'Résultats',
    value: `${Math.min(offset + PAGE_SIZE, values.length)}/${values.length}`,
  });
}

function generatePager<T>(
  title: string,
  values: T[],
  offset: number,
  row: (value: T, index: number) => APIEmbedField
): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(Colors.DarkBlue);

  addFields(embed, values, offset, row);

  return embed;
}

async function sendPager<T>(
  interaction: UserInteraction,
  message: Message<boolean> | InteractionResponse<boolean>,
  values: T[],
  title: string,
  row: (value: T, index: number) => APIEmbedField,
  sendDetailedView: (interaction: UserInteraction, value: T) => void
) {
  let offset = 0;
  const embed = generatePager(title, values, offset, row);

  await interaction.editReply({
    embeds: [embed],
    components: [
      generateNumbersRow(values, offset),
      generateArrowsRow(values, offset),
    ],
  });

  const addButtonListener = () => {
    const filter = (click: ButtonInteraction): boolean => {
      return click.user.id === interaction.user.id;
    };

    const collector = message.createMessageComponentCollector({
      filter,
      dispose: true,
      time: 30000,
      max: 1,
    });

    collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
      await buttonInteraction.deferUpdate();
      if (!isNaN(+buttonInteraction.customId)) {
        const index: number = +buttonInteraction.customId;
        return sendDetailedView(interaction, values[index + offset]);
      }
      changeOffset(buttonInteraction.customId as Direction, buttonInteraction);
    });
  };

  addButtonListener();

  const changeOffset = (
    direction: Direction,
    buttonInteraction: ButtonInteraction
  ) => {
    offset += direction === 'left' ? -PAGE_SIZE : PAGE_SIZE;
    offset = Math.min(values.length, Math.max(0, offset));
    const embed = generatePager(title, values, offset, row);

    buttonInteraction.editReply({
      embeds: [embed],
      components: [
        generateNumbersRow(values, offset),
        generateArrowsRow(values, offset),
      ],
    });

    addButtonListener();
  };
}

export default sendPager;
