// "A day in the system": an illustrative shift on SDC Command, drawn as a duty log.
import { Camera, ClipboardCheck, FileWarning, Footprints, MonitorCheck, RefreshCw } from "lucide-react";
import { Numeral } from "./ui";

const icons = [Camera, MonitorCheck, Footprints, FileWarning, RefreshCw, ClipboardCheck];

export function DayTimeline({ items }: { items: { time: string; title: string; text: string; tag: string }[] }) {
  return (
    <ol className="v2-day" aria-label="An illustrative shift on SDC Command">
      {items.map((it, i) => {
        const Icon = icons[i % icons.length];
        return (
          <li key={it.time + it.title} className={`v2-day-item${it.tag === "Incident" ? " is-alert" : ""}`}>
            <div className="v2-day-time">
              <Numeral value={it.time} />
              <span className="v2-day-dot" aria-hidden="true" />
            </div>
            <div className="v2-day-card" data-seal="" style={{ ["--i" as string]: i }}>
              <span className="v2-day-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
              <span className="v2-chip">{it.tag}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
