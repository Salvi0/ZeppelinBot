import { Snowflake, TextChannel } from "discord.js";
import { commandTypeHelpers as ct } from "../../../commandTypes.js";
import { resolveMessageMember } from "../../../pluginUtils.js";
import { messageLink } from "../../../utils.js";
import { canReadChannel } from "../../../utils/canReadChannel.js";
import { utilityCmd } from "../types.js";

export const ContextCmd = utilityCmd({
  trigger: "context",
  description: "Get a link to the context of the specified message",
  usage: "!context 94882524378968064 650391267720822785",
  permission: "can_context",

  signature: [
    {
      message: ct.messageTarget(),
    },
    {
      channel: ct.channel(),
      messageId: ct.string(),
    },
  ],

  async run({ message: msg, args, pluginData }) {
    if (args.channel && !(args.channel instanceof TextChannel)) {
      void pluginData.state.common.sendErrorMessage(msg, "Channel must be a text channel");
      return;
    }

    const channel = args.channel ?? args.message.channel;
    const messageId = args.messageId ?? args.message.messageId;

    const authorMember = await resolveMessageMember(msg);
    if (!canReadChannel(channel, authorMember)) {
      void pluginData.state.common.sendErrorMessage(msg, "Message context not found");
      return;
    }

    const previousMessage = (
      await (pluginData.guild.channels.cache.get(channel.id) as TextChannel).messages.fetch({
        limit: 1,
        before: messageId as Snowflake,
      })
    )[0];
    if (!previousMessage) {
      void pluginData.state.common.sendErrorMessage(msg, "Message context not found");
      return;
    }

    msg.channel.send(messageLink(pluginData.guild.id, previousMessage.channel.id, previousMessage.id));
  },
});
