import OpeningForm from "../opening-form";
export const metadata = { title: "Edit opening | Recruitment | SDC Command", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OpeningForm id={id} />;
}
