import type { PlasmoCSConfig as BaseConfig } from "plasmo"

declare module "plasmo" {
  export interface PlasmoCSConfig extends BaseConfig {
    matches?: string[]
    mount?: {
      (opts: { anchor: Element; element: HTMLElement }): HTMLElement
    }
  }
}
