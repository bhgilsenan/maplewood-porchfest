// One-off helper: prints the poster's table row data (and refreshments
// list) as JSON, reusing build-poster.mjs's PF_DATA/descriptor logic so the
// Figma rebuild and the PNG poster never drift out of sync with two copies
// of the same data. Run with: node print/dump-table-json.mjs
import { PF_DATA, TIME_SLOTS, parseHour, shortDescriptor, lemonadeRows } from "./build-poster.mjs";

const rows = PF_DATA.porches.map((porch) => ({
  id: porch.id,
  address: porch.address,
  cells: TIME_SLOTS.map((slot) => {
    const act = porch.performers.find(
      (p) => parseHour(p.time_start) < slot.hourEnd && parseHour(p.time_end) > slot.hourStart
    );
    if (!act) return { name: "", genre: "" };
    return { name: act.name, genre: shortDescriptor(porch.id, act.name) || act.genre };
  }),
}));

console.log(JSON.stringify({ rows, refreshments: lemonadeRows }, null, 0));
