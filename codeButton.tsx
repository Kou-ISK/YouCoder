import type { Button } from "~types/Button"

export function CodeButton(props: Button) {
  return (
    <div
      style={{
        padding: 16
      }}>
      <button style={{ background: props.color }}>{props.name}</button>
    </div>
  )
}
