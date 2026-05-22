import Common "../types/common";
import T "../types/logs";
import LogsLib "../lib/logs";

mixin (
  logsState : LogsLib.State
) {
  public query func getMessageLogs(filter : T.MessageFilter) : async [T.MessageLog] {
    LogsLib.getMessageLogs(logsState, filter);
  };

  public func addMessageLog(log : T.MessageLogInput) : async Common.Id {
    LogsLib.addMessageLog(logsState, log);
  };
};
