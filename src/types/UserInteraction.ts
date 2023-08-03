import { ButtonInteraction, CommandInteraction } from 'discord.js';

type UserInteraction = CommandInteraction | ButtonInteraction<'cached'>;

export default UserInteraction;
