declare namespace chrome {
  export namespace storage {
    export interface StorageChange {
      oldValue?: any
      newValue?: any
    }

    export interface StorageChanges {
      [key: string]: StorageChange
    }

    export interface StorageArea {
      get(
        keys: string | string[] | Object | null
      ): Promise<{ [key: string]: any }>
      set(items: Object): Promise<void>
      remove(keys: string | string[]): Promise<void>
      clear(): Promise<void>
    }

    export type StorageChangeCallback = (
      changes: StorageChanges,
      areaName: string
    ) => void

    export interface StorageEventTarget {
      addListener: (callback: StorageChangeCallback) => void
      removeListener: (callback: StorageChangeCallback) => void
    }

    export const local: StorageArea
    export const sync: StorageArea
    export const managed: StorageArea
    export const onChanged: StorageEventTarget
  }
}
