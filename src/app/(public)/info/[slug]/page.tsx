import { notFound } from 'next/navigation'
import { InfoPageShell } from '@/components/layout/InfoPageShell'

type PageProps = {
  params: Promise<{ slug: string }>
}

const CONTENT: Record<string, { title: string; description: string }> = {
  'core-features': {
    title: 'Core Features',
    description: 'Overview of the main OpenEvents capabilities. This is a temporary placeholder page.',
  },
  'pro-experience': {
    title: 'Pro Experience',
    description: 'Information about pro-level capabilities will be published here. Placeholder content for now.',
  },
  integrations: {
    title: 'Integrations',
    description: 'Third-party integrations and setup guides will be documented here. Placeholder content for now.',
  },
  'customer-stories': {
    title: 'Customer Stories',
    description: 'Case studies and customer success stories will be added here. Placeholder content for now.',
  },
  'best-practices': {
    title: 'Best Practices',
    description: 'Recommended event management best practices will be available here. Placeholder content for now.',
  },
}

export default async function InfoDetailPage({ params }: PageProps) {
  const { slug } = await params
  const content = CONTENT[slug]

  if (!content) {
    notFound()
  }

  return <InfoPageShell title={content.title} description={content.description} />
}
