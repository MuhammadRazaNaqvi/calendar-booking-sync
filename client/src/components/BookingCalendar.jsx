import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons.jsx";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
});

function CustomToolbar({ label, onNavigate }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <h2 className="font-display text-base font-bold px-1">{label}</h2>
        <button
          type="button"
          onClick={() => onNavigate("NEXT")}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onNavigate("TODAY")}
        className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
      >
        Today
      </button>
    </div>
  );
}

const SOURCE_STYLES = {
  turo: { background: "#ffedd5", border: "#fdba74", color: "#c2410c" },
  direct: { background: "#dbeafe", border: "#93c5fd", color: "#1d4ed8" },
};
const CONFLICT_STYLE = { background: "#fee2e2", border: "#fca5a5", color: "#b91c1c" };

export default function BookingCalendar({ bookings }) {
  // react-big-calendar's own uncontrolled date state doesn't re-render reliably on React 19, so control it here.
  const [date, setDate] = useState(new Date());
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.source === "turo" ? "Turo" : "Direct"} · ${booking.renter_name}${
      booking.status === "flagged_conflict" ? " (conflict)" : ""
    }`,
    start: new Date(`${booking.start_date}T00:00:00`),
    end: new Date(`${booking.end_date}T00:00:00`),
    allDay: true,
    resource: booking,
  }));

  const eventPropGetter = (event) => {
    const style =
      event.resource.status === "flagged_conflict" ? CONFLICT_STYLE : SOURCE_STYLES[event.resource.source];
    return {
      style: {
        backgroundColor: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: "6px",
      },
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 min-w-0">
      <Calendar
        localizer={localizer}
        events={events}
        views={["month"]}
        defaultView="month"
        date={date}
        onNavigate={setDate}
        style={{ height: 560 }}
        eventPropGetter={eventPropGetter}
        components={{ toolbar: CustomToolbar }}
      />
    </div>
  );
}
