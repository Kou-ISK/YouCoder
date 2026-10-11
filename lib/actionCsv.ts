export type CsvAction = {
  team: string
  action: string
  start: number
  end?: number
  labels: readonly string[]
}

const LABEL_SEPARATOR = " - "
const BASE_HEADERS = [
  "Team",
  "Action",
  "Start (seconds)",
  "End (seconds)",
  "Labels"
]

// Quote every field, including headers. CSV quoting alone does not prevent a
// spreadsheet from evaluating a user-provided value as a formula.
const escapeCsvCell = (value: string): string => {
  const formulaPrefix = /^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/u
  const controlPrefix = /^[\t\r\n]/
  const safeValue =
    formulaPrefix.test(value) || controlPrefix.test(value) ? `'${value}` : value

  return `"${safeValue.replace(/"/g, '""')}"`
}

const elapsedSeconds = (milliseconds: number | undefined): string =>
  milliseconds !== undefined &&
  Number.isFinite(milliseconds) &&
  milliseconds >= 0
    ? String(milliseconds / 1000)
    : ""

/**
 * Build an Excel-friendly CSV without reading or changing browser state.
 * Action times are elapsed video milliseconds, exported as numeric seconds.
 * Plain labels retain their own column; categorized labels use sorted columns.
 */
export const buildActionsCsv = (actionsList: readonly CsvAction[]): string => {
  const categories = new Set<string>()
  const rows = actionsList.map((action) => {
    const plainLabels: string[] = []
    const labelsByCategory = new Map<string, string[]>()

    for (const label of action.labels) {
      const separatorIndex = label.indexOf(LABEL_SEPARATOR)
      const category = label.slice(0, separatorIndex)

      if (separatorIndex < 0 || category.trim() === "") {
        plainLabels.push(label)
        continue
      }

      const value = label.slice(separatorIndex + LABEL_SEPARATOR.length)
      categories.add(category)
      const values = labelsByCategory.get(category) ?? []
      values.push(value)
      labelsByCategory.set(category, values)
    }

    return { action, plainLabels, labelsByCategory }
  })

  const sortedCategories = Array.from(categories).sort()
  const usedHeaders = new Set(BASE_HEADERS.map(escapeCsvCell))
  const categoryHeaders = sortedCategories.map((category) => {
    let header = category
    let suffix = 2
    while (usedHeaders.has(escapeCsvCell(header))) {
      header = `${category} (${suffix++})`
    }
    usedHeaders.add(escapeCsvCell(header))
    return header
  })

  const csvRows = [
    [...BASE_HEADERS, ...categoryHeaders],
    ...rows.map(({ action, plainLabels, labelsByCategory }) => [
      action.team,
      action.action,
      elapsedSeconds(action.start),
      elapsedSeconds(action.end),
      plainLabels.join("; "),
      ...sortedCategories.map((category) =>
        (labelsByCategory.get(category) ?? []).join("; ")
      )
    ])
  ]

  // The BOM lets Excel detect Japanese UTF-8 text; CRLF separates CSV records.
  return `\uFEFF${csvRows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`
}
