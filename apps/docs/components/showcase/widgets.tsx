"use client";

import {
  GridLayout,
  type Layout,
  type ResponsiveLayouts,
  useResponsiveLayout,
} from "@snapgrid/react";
import { type ReactNode, useState } from "react";
import { Avatar } from "./avatars";
import { AreaChart, BarChart, Donut, Sparkline, useSize } from "./charts";

/* ── Dummy data ─────────────────────────────────────────────────────────── */
const REVENUE = [38, 41, 39, 45, 44, 52, 49, 58, 61, 57, 66, 72];
const USERS = [120, 118, 125, 130, 128, 141, 150, 147, 162, 170, 168, 181];
const CONVERSION = [3.1, 3.0, 3.3, 3.2, 3.5, 3.4, 3.6, 3.5, 3.8, 3.7, 3.9, 4.1];
const TRAFFIC = [
  20, 22, 19, 26, 30, 28, 34, 31, 38, 42, 39, 46, 44, 50, 55, 52, 60, 58, 64, 70, 67, 73, 78, 76,
  82, 88, 85, 92, 96, 101,
];
const SALES = [42, 58, 35, 71, 49, 63];
const SALES_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SOURCES = [
  { label: "Direct", value: 42, color: "#c2410c" },
  { label: "Search", value: 28, color: "#ea7a47" },
  { label: "Social", value: 18, color: "#d99a2b" },
  { label: "Referral", value: 12, color: "#9a6b4f" },
];
const ACTIVITY = [
  { name: "Alex Rivera", what: "signed up", when: "2m" },
  { name: "Maya Chen", what: "upgraded to Pro", when: "1h" },
  { name: "Leo Park", what: "left a comment", when: "2h" },
  { name: "Sara Idris", what: "connected the API", when: "3h" },
  { name: "Tom Becker", what: "invited a teammate", when: "5h" },
];
const ORDERS = [
  { id: "#4821", who: "Acme Inc", amt: "$1,290", status: "Paid" },
  { id: "#4820", who: "Globex", amt: "$640", status: "Pending" },
  { id: "#4819", who: "Initech", amt: "$2,100", status: "Paid" },
  { id: "#4818", who: "Umbrella", amt: "$320", status: "Refunded" },
];
interface Member {
  id: string;
  name: string;
  role: string;
  online: boolean;
  bio: string;
}
const TEAM: Member[] = [
  {
    id: "maya",
    name: "Maya Chen",
    role: "Product",
    online: true,
    bio: "Owns the product vision and keeps the roadmap honest. Big on fast onboarding, and allergic to features nobody asked for.",
  },
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Engineering",
    online: true,
    bio: "Runs the platform and CI. If it ships green, thank Alex. Lives in the terminal and dreams in YAML.",
  },
  {
    id: "leo",
    name: "Leo Park",
    role: "Design",
    online: false,
    bio: "Designs the system and sweats every pixel of spacing and motion. Will redo it until it feels right.",
  },
  {
    id: "sara",
    name: "Sara Idris",
    role: "Data",
    online: true,
    bio: "Turns raw events into dashboards, and the occasional ML model. Always asking what the data actually says.",
  },
  {
    id: "tom",
    name: "Tom Becker",
    role: "Sales",
    online: false,
    bio: "Closes the enterprise deals and relays what customers really need. Never met a quota he didn't beat.",
  },
  {
    id: "nadia",
    name: "Nadia Khan",
    role: "Support",
    online: true,
    bio: "First to reply in the inbox; keeps customers happy and heard. Turns angry tickets into thank-you notes.",
  },
  {
    id: "priya",
    name: "Priya Nair",
    role: "Marketing",
    online: true,
    bio: "Runs growth and brand. Knows which channels actually convert. Has strong opinions about your landing page.",
  },
  {
    id: "sam",
    name: "Sam Cole",
    role: "Operations",
    online: false,
    bio: "Keeps the company running: vendors, tooling, and the all-hands. The reason the office coffee never runs out.",
  },
  {
    id: "dana",
    name: "Dana Wu",
    role: "Finance",
    online: true,
    bio: "Owns the numbers and the runway, and approves your expenses (sometimes). Spreadsheets are a love language.",
  },
];
const TEAM_BY_ID = new Map(TEAM.map((m) => [m.id, m]));
// One member starts "promoted" to a feature card so the size-aware rendering
// shows on load; resize any member to shift the emphasis. Tiles 12 cols × 2 rows.
export const TEAM_LAYOUT: Layout = [
  { i: "maya", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
  { i: "alex", x: 4, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "sara", x: 7, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "tom", x: 10, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "sam", x: 11, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "leo", x: 4, y: 1, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "priya", x: 7, y: 1, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "nadia", x: 10, y: 1, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "dana", x: 11, y: 1, w: 1, h: 1, minW: 1, minH: 1 },
];
// Designed 6-col layout for narrow widths — same members keep their tier
// (Maya featured; alex/sara/leo/priya cards; tom/sam/nadia/dana compact).
export const TEAM_LAYOUT_NARROW: Layout = [
  { i: "maya", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1 },
  { i: "tom", x: 4, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "sam", x: 5, y: 0, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "nadia", x: 4, y: 1, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "dana", x: 5, y: 1, w: 1, h: 1, minW: 1, minH: 1 },
  { i: "alex", x: 0, y: 2, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "sara", x: 3, y: 2, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "leo", x: 0, y: 3, w: 3, h: 1, minW: 2, minH: 1 },
  { i: "priya", x: 3, y: 3, w: 3, h: 1, minW: 2, minH: 1 },
];
const TEAM_MARGIN = 10;
const TEAM_GRID = {
  margin: [TEAM_MARGIN, TEAM_MARGIN] as [number, number],
  containerPadding: [0, 0] as [number, number],
};
// Threshold sits below the team's width in the md dashboard band, so the team
// is wide (2 rows, fits the h3 widget) at md/lg and only goes narrow (4 rows,
// in the taller h5 widget) at the sm dashboard — never narrow inside an h3 cell.
const TEAM_BREAKPOINTS = { wide: 600, narrow: 0 };
const TEAM_COLS = { wide: 12, narrow: 6 };
const TEAM_LAYOUTS: ResponsiveLayouts = { wide: TEAM_LAYOUT, narrow: TEAM_LAYOUT_NARROW };
const teamRows = (l: Layout) => l.reduce((m, it) => Math.max(m, it.y + it.h), 0) || 1;
const WIDE_ROWS = teamRows(TEAM_LAYOUT); // 2
const NARROW_ROWS = teamRows(TEAM_LAYOUT_NARROW); // 4

/** Seeds for the header "who's here" presence stack (max shown, rest as +N). */
export const PRESENCE = TEAM.map((m) => m.name);

/* ── Widget bodies ──────────────────────────────────────────────────────── */
function Kpi({
  value,
  delta,
  data,
}: {
  value: string;
  delta: number;
  data: number[];
}) {
  const up = delta >= 0;
  return (
    <div className="sg-kpi">
      <div className="sg-kpi__row">
        <span className="sg-kpi__value">{value}</span>
        <span className={`sg-kpi__delta sg-kpi__delta--${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      </div>
      <Sparkline data={data} up={up} />
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  return (
    <ul className="sg-legend">
      {items.map((s) => (
        <li key={s.label}>
          <span className="sg-legend__dot" style={{ background: s.color }} />
          {s.label}
          <span className="sg-legend__val">{s.value}%</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityFeed() {
  return (
    <ul className="sg-activity">
      {ACTIVITY.map((a) => (
        <li key={`${a.name}-${a.when}`}>
          <Avatar seed={a.name} size={26} />
          <span className="sg-activity__text">
            <strong>{a.name}</strong> {a.what}
          </span>
          <span className="sg-activity__when">{a.when}</span>
        </li>
      ))}
    </ul>
  );
}

/** A nested grid of team members — each draggable and resizable, and itself
 *  responsive: 12 columns when wide, a designed 6-column layout when narrow.
 *  Its row height is derived from the measured tile body so the nested grid
 *  fills the outer tile exactly (two grids, no leftover gap). */
function TeamGrid() {
  const [ref, { w, h }] = useSize();
  const width = w || 600;
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(TEAM_LAYOUTS);
  const { cols, layout, onLayoutChange } = useResponsiveLayout({
    width,
    layouts,
    breakpoints: TEAM_BREAKPOINTS,
    cols: TEAM_COLS,
    onLayoutChange: (_layout, all) => setLayouts(all),
  });
  // Size rows to fill the tile body using the breakpoint's *default* row count,
  // so the grid matches the tile on load and members keep their size when one is
  // resized (the grid scrolls if a member is grown past the tile).
  const baseRows = cols >= TEAM_COLS.wide ? WIDE_ROWS : NARROW_ROWS;
  // Floor so rounding leaves a sub-pixel gap, never a sub-pixel overflow (which
  // would flash a scrollbar on the otherwise exact-fit default).
  const rowHeight =
    h > 0
      ? Math.max(48, Math.min(130, Math.floor((h - (baseRows - 1) * TEAM_MARGIN) / baseRows)))
      : 60;
  // The measured element (`.sg-teamgrid`) does NOT scroll — overflow lives on the
  // inner `__scroll` wrapper. Measuring a non-scrolling box keeps width/height
  // stable: a scrollbar can't steal the measured size and oscillate the layout.
  return (
    <div ref={ref} className="sg-teamgrid">
      <div className="sg-teamgrid__scroll">
        <GridLayout
          layout={layout}
          width={width}
          onLayoutChange={onLayoutChange}
          gridConfig={{ ...TEAM_GRID, cols, rowHeight }}
          resizeConfig={{ handles: ["se"] }}
        >
          {layout.map((it) => {
            const m = TEAM_BY_ID.get(it.i);
            return m ? <TeamMember key={it.i} member={m} w={it.w} h={it.h} /> : <div key={it.i} />;
          })}
        </GridLayout>
      </div>
    </div>
  );
}

/** Size-aware member card: bigger items show a bigger avatar and more detail. */
function TeamMember({ member, w, h }: { member: Member; w: number; h: number }) {
  const variant = w >= 4 && h >= 2 ? "feature" : w >= 3 ? "card" : "compact";
  const avatarSize = variant === "feature" ? 64 : variant === "card" ? 42 : 28;
  return (
    <div className="sg-tm" data-variant={variant} title={`${member.name} · ${member.role}`}>
      <div className="sg-tm__head">
        <span className="sg-tm__av" data-online={member.online || undefined}>
          <Avatar seed={member.name} size={avatarSize} />
        </span>
        <div className="sg-tm__info">
          <strong className="sg-tm__name">{member.name}</strong>
          {variant !== "compact" ? <span className="sg-tm__role">{member.role}</span> : null}
          {variant === "feature" ? (
            <span className="sg-tm__status" data-online={member.online || undefined}>
              {member.online ? "Online" : "Offline"}
            </span>
          ) : null}
        </div>
      </div>
      {variant === "feature" ? <p className="sg-tm__desc">{member.bio}</p> : null}
    </div>
  );
}

function OrdersTable() {
  return (
    <table className="sg-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th className="sg-table__num">Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {ORDERS.map((o) => (
          <tr key={o.id}>
            <td className="sg-table__mono">{o.id}</td>
            <td>{o.who}</td>
            <td className="sg-table__num sg-table__mono">{o.amt}</td>
            <td>
              <span className={`sg-badge sg-badge--${o.status.toLowerCase()}`}>{o.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Registry ───────────────────────────────────────────────────────────── */
export type WidgetType =
  | "revenue"
  | "users"
  | "conversion"
  | "traffic"
  | "sales"
  | "sources"
  | "activity"
  | "orders"
  | "team";

export interface WidgetDef {
  title: string;
  w: number;
  h: number;
  minW: number;
  minH: number;
  render: () => ReactNode;
}

export const WIDGETS: Record<WidgetType, WidgetDef> = {
  revenue: {
    title: "Revenue",
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
    render: () => <Kpi value="$72.4k" delta={12.4} data={REVENUE} />,
  },
  users: {
    title: "Active users",
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
    render: () => <Kpi value="18,420" delta={8.1} data={USERS} />,
  },
  conversion: {
    title: "Conversion",
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
    render: () => <Kpi value="4.1%" delta={-1.3} data={CONVERSION} />,
  },
  traffic: {
    title: "Traffic",
    w: 6,
    h: 3,
    minW: 3,
    minH: 2,
    render: () => <AreaChart data={TRAFFIC} />,
  },
  sales: {
    title: "Sales by month",
    w: 3,
    h: 3,
    minW: 2,
    minH: 2,
    render: () => <BarChart data={SALES} labels={SALES_LABELS} />,
  },
  sources: {
    title: "Traffic sources",
    w: 3,
    h: 5,
    minW: 3,
    minH: 3,
    render: () => (
      <div className="sg-donutwrap">
        <Donut segments={SOURCES} centerLabel="100%" centerSub="sessions" />
        <Legend items={SOURCES} />
      </div>
    ),
  },
  activity: {
    title: "Activity",
    w: 4,
    h: 3,
    minW: 3,
    minH: 3,
    render: () => <ActivityFeed />,
  },
  orders: {
    title: "Recent orders",
    w: 8,
    h: 3,
    minW: 4,
    minH: 3,
    render: () => <OrdersTable />,
  },
  team: {
    title: "Team",
    w: 12,
    // h:4 (not the default layout's 3) so a freshly *added* Team fits its 4-row
    // narrow layout when the dashboard is at a small breakpoint.
    h: 4,
    minW: 6,
    minH: 3,
    render: () => <TeamGrid />,
  },
};

export const WIDGET_ORDER: WidgetType[] = [
  "revenue",
  "users",
  "conversion",
  "traffic",
  "sales",
  "sources",
  "orders",
  "activity",
  "team",
];

export interface Panel {
  i: string;
  type: WidgetType;
}

export const DEFAULT_PANELS: Panel[] = [
  { i: "revenue", type: "revenue" },
  { i: "users", type: "users" },
  { i: "conversion", type: "conversion" },
  { i: "sources", type: "sources" },
  { i: "traffic", type: "traffic" },
  { i: "sales", type: "sales" },
  { i: "orders", type: "orders" },
  { i: "activity", type: "activity" },
  { i: "team", type: "team" },
];

// Designed per-breakpoint layouts so each width looks intentional (not just a
// clamped/compacted version of the next). lg = 12 cols, md = 8, sm = 4.
export const DEFAULT_LAYOUT: Layout = [
  { i: "revenue", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "users", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "conversion", x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "sources", x: 9, y: 0, w: 3, h: 5, minW: 3, minH: 3 },
  { i: "traffic", x: 0, y: 2, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "sales", x: 6, y: 2, w: 3, h: 3, minW: 2, minH: 2 },
  { i: "orders", x: 0, y: 5, w: 8, h: 3, minW: 4, minH: 3 },
  { i: "activity", x: 8, y: 5, w: 4, h: 3, minW: 3, minH: 3 },
  { i: "team", x: 0, y: 8, w: 12, h: 3, minW: 6, minH: 3 },
];

export const DEFAULT_LAYOUT_MD: Layout = [
  { i: "revenue", x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "users", x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "conversion", x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "sources", x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  { i: "sales", x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "traffic", x: 0, y: 6, w: 8, h: 3, minW: 3, minH: 2 },
  { i: "orders", x: 0, y: 9, w: 8, h: 3, minW: 4, minH: 3 },
  { i: "activity", x: 0, y: 12, w: 8, h: 3, minW: 3, minH: 3 },
  { i: "team", x: 0, y: 15, w: 8, h: 3, minW: 6, minH: 3 },
];

export const DEFAULT_LAYOUT_SM: Layout = [
  { i: "revenue", x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "users", x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "conversion", x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
  { i: "sources", x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
  { i: "traffic", x: 0, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "sales", x: 0, y: 11, w: 4, h: 3, minW: 2, minH: 2 },
  { i: "orders", x: 0, y: 14, w: 4, h: 3, minW: 4, minH: 3 },
  { i: "activity", x: 0, y: 17, w: 4, h: 3, minW: 3, minH: 3 },
  { i: "team", x: 0, y: 20, w: 4, h: 5, minW: 4, minH: 4 },
];
