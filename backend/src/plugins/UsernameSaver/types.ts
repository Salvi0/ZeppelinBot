import { BasePluginType, guildEventListener } from "knub";
import { UsernameHistory } from "../../data/UsernameHistory";
import { Queue } from "../../Queue";

export interface UsernameSaverPluginType extends BasePluginType {
  state: {
    usernameHistory: UsernameHistory;
    updateQueue: Queue;
  };
}

export const usernameSaverEvt = guildEventListener<UsernameSaverPluginType>();
