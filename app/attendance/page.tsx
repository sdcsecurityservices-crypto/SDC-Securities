import Attendance from "./attendance";
export const metadata = {
  title: "Guard Attendance | SDC Command",
  manifest: "/attendance.webmanifest",
};
export default function Page() {
  return <Attendance />;
}
