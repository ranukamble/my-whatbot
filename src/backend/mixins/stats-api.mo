import T "../types/stats";
import StatsLib "../lib/stats";

mixin (
  statsState : StatsLib.State
) {
  public query func getDashboardStats() : async T.DashboardStats {
    StatsLib.getDashboardStats(statsState);
  };
};
