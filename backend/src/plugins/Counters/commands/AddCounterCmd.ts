import { Snowflake, TextChannel } from "discord.js";
import { guildPluginMessageCommand } from "knub";
import { waitForReply } from "knub/helpers";
import { commandTypeHelpers as ct } from "../../../commandTypes.js";
import { UnknownUser, resolveUser } from "../../../utils.js";
import { changeCounterValue } from "../functions/changeCounterValue.js";
import { CountersPluginType } from "../types.js";

export const AddCounterCmd = guildPluginMessageCommand<CountersPluginType>()({
  trigger: ["counters add", "counter add", "addcounter"],
  permission: "can_edit",

  signature: [
    {
      counterName: ct.string(),
      amount: ct.number(),
    },
    {
      counterName: ct.string(),
      user: ct.resolvedUser(),
      amount: ct.number(),
    },
    {
      counterName: ct.string(),
      channel: ct.textChannel(),
      amount: ct.number(),
    },
    {
      counterName: ct.string(),
      channel: ct.textChannel(),
      user: ct.resolvedUser(),
      amount: ct.number(),
    },
    {
      counterName: ct.string(),
      user: ct.resolvedUser(),
      channel: ct.textChannel(),
      amount: ct.number(),
    },
  ],

  async run({ pluginData, message, args }) {
    const config = await pluginData.config.getForMessage(message);
    const counter = config.counters[args.counterName];
    const counterId = pluginData.state.counterIds[args.counterName];
    if (!counter || !counterId) {
      void pluginData.state.common.sendErrorMessage(message, `Unknown counter: ${args.counterName}`);
      return;
    }

    if (counter.can_edit === false) {
      void pluginData.state.common.sendErrorMessage(message, `Missing permissions to edit this counter's value`);
      return;
    }

    if (args.channel && !counter.per_channel) {
      void pluginData.state.common.sendErrorMessage(message, `This counter is not per-channel`);
      return;
    }

    if (args.user && !counter.per_user) {
      void pluginData.state.common.sendErrorMessage(message, `This counter is not per-user`);
      return;
    }

    let channel = args.channel;
    if (!channel && counter.per_channel) {
      message.channel.send(`Which channel's counter value would you like to add to?`);
      const reply = await waitForReply(pluginData.client, message.channel, message.author.id);
      if (!reply || !reply.content) {
        void pluginData.state.common.sendErrorMessage(message, "Cancelling");
        return;
      }

      const potentialChannel = pluginData.guild.channels.resolve(reply.content as Snowflake);
      if (!potentialChannel || !(potentialChannel instanceof TextChannel)) {
        void pluginData.state.common.sendErrorMessage(message, "Channel is not a text channel, cancelling");
        return;
      }

      channel = potentialChannel;
    }

    let user = args.user;
    if (!user && counter.per_user) {
      message.channel.send(`Which user's counter value would you like to add to?`);
      const reply = await waitForReply(pluginData.client, message.channel, message.author.id);
      if (!reply || !reply.content) {
        void pluginData.state.common.sendErrorMessage(message, "Cancelling");
        return;
      }

      const potentialUser = await resolveUser(pluginData.client, reply.content);
      if (!potentialUser || potentialUser instanceof UnknownUser) {
        void pluginData.state.common.sendErrorMessage(message, "Unknown user, cancelling");
        return;
      }

      user = potentialUser;
    }

    let amount = args.amount;
    if (!amount) {
      message.channel.send("How much would you like to add to the counter's value?");
      const reply = await waitForReply(pluginData.client, message.channel, message.author.id);
      if (!reply || !reply.content) {
        void pluginData.state.common.sendErrorMessage(message, "Cancelling");
        return;
      }

      const potentialAmount = parseInt(reply.content, 10);
      if (!potentialAmount) {
        void pluginData.state.common.sendErrorMessage(message, "Not a number, cancelling");
        return;
      }

      amount = potentialAmount;
    }

    await changeCounterValue(pluginData, args.counterName, channel?.id ?? null, user?.id ?? null, amount);
    const newValue = await pluginData.state.counters.getCurrentValue(counterId, channel?.id ?? null, user?.id ?? null);

    if (channel && user) {
      message.channel.send(
        `Added ${amount} to **${args.counterName}** for <@!${user.id}> in <#${channel.id}>. The value is now ${newValue}.`,
      );
    } else if (channel) {
      message.channel.send(
        `Added ${amount} to **${args.counterName}** in <#${channel.id}>. The value is now ${newValue}.`,
      );
    } else if (user) {
      message.channel.send(
        `Added ${amount} to **${args.counterName}** for <@!${user.id}>. The value is now ${newValue}.`,
      );
    } else {
      message.channel.send(`Added ${amount} to **${args.counterName}**. The value is now ${newValue}.`);
    }
  },
});
