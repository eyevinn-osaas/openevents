type InfoPageShellProps = {
  title: string
  description: string
}

export function InfoPageShell({ title, description }: InfoPageShellProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>
        <p className="mt-6 text-sm text-gray-500">
          This is a temporary placeholder page. Final content will be added later.
        </p>
      </section>
    </main>
  )
}
