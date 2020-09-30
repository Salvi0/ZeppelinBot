import { GuildPluginData } from "knub";
import { IgnoredEventType, KickOptions, KickResult, ModActionsPluginType } from "../types";
import { Member } from "eris";
import { notifyUser, resolveUser, stripObjectToScalars, ucfirst, UserNotificationResult } from "../../../utils";
import { renderTemplate } from "../../../templateFormatter";
import { getDefaultContactMethods } from "./getDefaultContactMethods";
import { LogType } from "../../../data/LogType";
import { ignoreEvent } from "./ignoreEvent";
import { CaseTypes } from "../../../data/CaseTypes";
import { CasesPlugin } from "../../Cases/CasesPlugin";

/**
 * Kick the specified server member. Generates a case.
 */
export async function kickMember(
  pluginData: GuildPluginData<ModActionsPluginType>,
  member: Member,
  reason: string = null,
  kickOptions: KickOptions = {},
): Promise<KickResult> {
  const config = pluginData.config.get();

  // Attempt to message the user *before* kicking them, as doing it after may not be possible
  let notifyResult: UserNotificationResult = { method: null, success: true };
  if (reason) {
    const kickMessage = await renderTemplate(config.kick_message, {
      guildName: pluginData.guild.name,
      reason,
    });

    const contactMethods = kickOptions?.contactMethods
      ? kickOptions.contactMethods
      : getDefaultContactMethods(pluginData, "kick");
    notifyResult = await notifyUser(member.user, kickMessage, contactMethods);
  }

  // Kick the user
  pluginData.state.serverLogs.ignoreLog(LogType.MEMBER_KICK, member.id);
  ignoreEvent(pluginData, IgnoredEventType.Kick, member.id);
  try {
    await member.kick(reason != null ? encodeURIComponent(reason) : undefined);
  } catch (e) {
    return {
      status: "failed",
      error: e.message,
    };
  }

  // Create a case for this action
  const casesPlugin = pluginData.getPlugin(CasesPlugin);
  const createdCase = await casesPlugin.createCase({
    ...(kickOptions.caseArgs || {}),
    userId: member.id,
    modId: kickOptions.caseArgs?.modId,
    type: CaseTypes.Kick,
    reason,
    noteDetails: notifyResult.text ? [ucfirst(notifyResult.text)] : [],
  });

  // Log the action
  const mod = await resolveUser(pluginData.client, kickOptions.caseArgs?.modId);
  pluginData.state.serverLogs.log(LogType.MEMBER_KICK, {
    mod: stripObjectToScalars(mod),
    user: stripObjectToScalars(member.user),
    caseNumber: createdCase.case_number,
    reason,
  });

  return {
    status: "success",
    case: createdCase,
    notifyResult,
  };
}
