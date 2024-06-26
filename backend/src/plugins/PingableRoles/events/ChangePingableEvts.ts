import { pingableRolesEvt } from "../types.js";
import { disablePingableRoles } from "../utils/disablePingableRoles.js";
import { enablePingableRoles } from "../utils/enablePingableRoles.js";
import { getPingableRolesForChannel } from "../utils/getPingableRolesForChannel.js";

const TIMEOUT = 10 * 1000;

export const TypingEnablePingableEvt = pingableRolesEvt({
  event: "typingStart",

  async listener(meta) {
    const pluginData = meta.pluginData;
    const channel = meta.args.typing.channel;

    const pingableRoles = await getPingableRolesForChannel(pluginData, channel.id);
    if (pingableRoles.length === 0) return;

    if (pluginData.state.timeouts.has(channel.id)) {
      clearTimeout(pluginData.state.timeouts.get(channel.id));
    }

    enablePingableRoles(pluginData, pingableRoles);

    const timeout = setTimeout(() => {
      disablePingableRoles(pluginData, pingableRoles);
    }, TIMEOUT);
    pluginData.state.timeouts.set(channel.id, timeout);
  },
});

export const MessageCreateDisablePingableEvt = pingableRolesEvt({
  event: "messageCreate",

  async listener(meta) {
    const pluginData = meta.pluginData;
    const msg = meta.args.message;

    const pingableRoles = await getPingableRolesForChannel(pluginData, msg.channel.id);
    if (pingableRoles.length === 0) return;

    if (pluginData.state.timeouts.has(msg.channel.id)) {
      clearTimeout(pluginData.state.timeouts.get(msg.channel.id));
    }

    disablePingableRoles(pluginData, pingableRoles);
  },
});
