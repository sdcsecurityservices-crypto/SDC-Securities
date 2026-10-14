import Application from "./application";
export const metadata = { title: "Application | Recruitment | SDC Command", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Application id={id} />;
}
