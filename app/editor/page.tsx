import { Editor } from "@/components/editor"

// searchParams is async in Next.js 16.
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>
}) {
  const { preset } = await searchParams
  return <Editor presetId={preset} />
}
