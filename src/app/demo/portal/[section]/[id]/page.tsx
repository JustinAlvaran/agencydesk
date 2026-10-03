import { DemoRecord } from '@/components/demo-record';
export const metadata = { title: 'Sample client record', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <DemoRecord section={section} id={id} client />;
}
