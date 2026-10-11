import { buildActionsCsv, type CsvAction } from "./actionCsv"

const createAction = (overrides: Partial<CsvAction> = {}): CsvAction => ({
  team: "Team A",
  action: "Pass",
  start: 12345,
  end: 67890,
  labels: [],
  ...overrides
})

// Parse RFC 4180 records independently, preserving quoted newlines and quotes.
const parseCsv = (csv: string): string[][] => {
  const records: string[][] = []
  let record: string[] = []
  let field = ""
  let quoted = false

  for (
    let index = csv.startsWith("\uFEFF") ? 1 : 0;
    index < csv.length;
    index++
  ) {
    const character = csv[index]
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === ",") {
      record.push(field)
      field = ""
    } else if (!quoted && character === "\r" && csv[index + 1] === "\n") {
      records.push([...record, field])
      record = []
      field = ""
      index++
    } else {
      field += character
    }
  }

  if (quoted || record.length || field.length) {
    throw new Error("Incomplete CSV record")
  }
  return records
}

describe("buildActionsCsv", () => {
  test("exports elapsed video seconds with millisecond precision, not epoch dates", () => {
    const records = parseCsv(buildActionsCsv([createAction()]))

    expect(records).toEqual([
      ["Team", "Action", "Start (seconds)", "End (seconds)", "Labels"],
      ["Team A", "Pass", "12.345", "67.89", ""]
    ])
  })

  test("preserves zero timestamps and leaves an unfinished end empty", () => {
    const records = parseCsv(
      buildActionsCsv([
        createAction({ start: 0, end: 0 }),
        createAction({ start: 86400123, end: undefined })
      ])
    )

    expect(records[1].slice(2, 4)).toEqual(["0", "0"])
    expect(records[2].slice(2, 4)).toEqual(["86400.123", ""])
  })

  test.each([NaN, Infinity, -Infinity, -1])(
    "does not emit an invalid elapsed timestamp: %s",
    (time) => {
      const records = parseCsv(
        buildActionsCsv([createAction({ start: time, end: time })])
      )
      expect(records[1].slice(2, 4)).toEqual(["", ""])
    }
  )

  test("includes a UTF-8 BOM and RFC 4180 CRLF record endings", () => {
    const csv = buildActionsCsv([
      createAction({ team: "日本代表", action: "得点" })
    ])

    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv.endsWith("\r\n")).toBe(true)
    expect(csv.match(/\r\n/g)).toHaveLength(2)
    expect(parseCsv(csv)[1].slice(0, 2)).toEqual(["日本代表", "得点"])
  })

  test("escapes commas, double quotes, and embedded newlines in values and headers", () => {
    const category = 'Result, "detail"\nline'
    const team = 'Team, "A"\r\nsecond line'
    const action = 'Pass "left",\nright'
    const value = 'A, "quoted"\r\nlabel'
    const csv = buildActionsCsv([
      createAction({ team, action, labels: [`${category} - ${value}`] })
    ])

    expect(csv).toContain('"Team, ""A""\r\nsecond line"')
    expect(parseCsv(csv)).toEqual([
      [
        "Team",
        "Action",
        "Start (seconds)",
        "End (seconds)",
        "Labels",
        category
      ],
      [team, action, "12.345", "67.89", "", value]
    ])
  })

  test("keeps plain labels, sorted categories, repeated labels, and extra separators", () => {
    const records = parseCsv(
      buildActionsCsv([
        createAction({
          labels: [
            "Good",
            "Type - first - serve",
            "Result - ace",
            "Result - winner",
            "Accurate"
          ]
        }),
        createAction({ labels: ["Other - left"] })
      ])
    )

    expect(records[0].slice(4)).toEqual(["Labels", "Other", "Result", "Type"])
    expect(records[1].slice(4)).toEqual([
      "Good; Accurate",
      "",
      "ace; winner",
      "first - serve"
    ])
    expect(records[2].slice(4)).toEqual(["", "left", "", ""])
  })

  test("preserves labels with empty categories instead of dropping them", () => {
    const records = parseCsv(
      buildActionsCsv([createAction({ labels: [" - left", "   - right"] })])
    )
    expect(records[0]).toHaveLength(5)
    expect(records[1][4]).toBe("' - left;    - right")
  })

  test("handles prototype-property category names as ordinary data", () => {
    const records = parseCsv(
      buildActionsCsv([
        createAction({
          labels: ["__proto__ - safe", "constructor - value", "toString - text"]
        })
      ])
    )

    expect(records[0].slice(5)).toEqual([
      "__proto__",
      "constructor",
      "toString"
    ])
    expect(records[1].slice(5)).toEqual(["safe", "value", "text"])
  })

  test("avoids header collisions without merging distinct categories", () => {
    const records = parseCsv(
      buildActionsCsv([
        createAction({
          labels: [
            "Team - home",
            "Team (2) - away",
            "Labels - category",
            "plain"
          ]
        })
      ])
    )

    expect(new Set(records[0]).size).toBe(records[0].length)
    expect(records[0].slice(5)).toEqual([
      "Labels (2)",
      "Team (2)",
      "Team (2) (2)"
    ])
    expect(records[1].slice(4)).toEqual(["plain", "category", "home", "away"])
  })

  test.each([
    "=1+1",
    "+SUM(A1:A2)",
    "-1+2",
    "@SUM(A1:A2)",
    "\t=1+1",
    "\r=1+1",
    "\n=1+1",
    "  =1+1",
    "\u0000=1+1",
    "\uFEFF=1+1",
    "\ttext",
    "\rtext",
    "\ntext",
    "＝1+1",
    "＋1+1",
    "－1+1",
    "＠SUM(A1:A2)"
  ])(
    "neutralizes spreadsheet formula prefixes in every text column: %j",
    (value) => {
      const records = parseCsv(
        buildActionsCsv([
          createAction({
            team: value,
            action: value,
            labels: [value, `Category - ${value}`]
          })
        ])
      )

      expect(records[1][0]).toBe(`'${value}`)
      expect(records[1][1]).toBe(`'${value}`)
      expect(records[1][4]).toBe(`'${value}`)
      expect(records[1][5]).toBe(`'${value}`)
    }
  )

  test("keeps headers unique after formula protection", () => {
    const records = parseCsv(
      buildActionsCsv([
        createAction({ labels: ["=1+1 - formula", "'=1+1 - literal"] })
      ])
    )

    expect(new Set(records[0]).size).toBe(records[0].length)
    expect(records[0].slice(5)).toEqual(["'=1+1", "'=1+1 (2)"])
    expect(records[1].slice(5)).toEqual(["literal", "formula"])
  })

  test.each(["=1+1", "+1", "-1", "@A1", "  =1+1", "\t=1+1"])(
    "also neutralizes formula injection in category headers: %j",
    (category) => {
      const records = parseCsv(
        buildActionsCsv([createAction({ labels: [`${category} - value`] })])
      )
      expect(records[0][5]).toBe(`'${category}`)
      expect(records[1][5]).toBe("value")
    }
  )

  test("does not let embedded CSV delimiters inject another spreadsheet cell", () => {
    const value = 'ordinary",=HYPERLINK("https://example.invalid")\r\nnext'
    const records = parseCsv(buildActionsCsv([createAction({ team: value })]))

    expect(records).toHaveLength(2)
    expect(records[1]).toHaveLength(5)
    expect(records[1][0]).toBe(value)
  })

  test("returns a header-only CSV for no actions and leaves inputs unchanged", () => {
    expect(parseCsv(buildActionsCsv([]))).toEqual([
      ["Team", "Action", "Start (seconds)", "End (seconds)", "Labels"]
    ])
    const action = Object.freeze(
      createAction({ labels: Object.freeze(["Type - pass", "Good"]) })
    )
    const actions = Object.freeze([action])

    expect(() => buildActionsCsv(actions)).not.toThrow()
    expect(action.labels).toEqual(["Type - pass", "Good"])
  })
})
