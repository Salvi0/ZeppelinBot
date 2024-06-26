import { commandTypeHelpers as ct } from "../../../commandTypes.js";
import { postCmd } from "../types.js";
import { actualPostCmd } from "../util/actualPostCmd.js";

export const PostCmd = postCmd({
  trigger: "post",
  permission: "can_post",

  signature: {
    channel: ct.textChannel(),
    content: ct.string({ catchAll: true }),

    "enable-mentions": ct.bool({ option: true, isSwitch: true }),
    schedule: ct.string({ option: true }),
    repeat: ct.delay({ option: true }),
    "repeat-until": ct.string({ option: true }),
    "repeat-times": ct.number({ option: true }),
  },

  async run({ message: msg, args, pluginData }) {
    actualPostCmd(pluginData, msg, args.channel, { content: args.content }, args);
  },
});
