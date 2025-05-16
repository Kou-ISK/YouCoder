const HOTKEYS_STORAGE_KEY = "youcoder_hotkeys"

export type HotkeyConfig = {
  actions: Record<string, string> // アクション名とホットキーの対応
  labels: Record<string, string> // ラベル名とホットキーの対応
}

// デフォルトのホットキー設定
const defaultHotkeys: HotkeyConfig = {
  actions: {
    "Team A_Shoot": "Q",
    "Team A_Pass": "W"
  },
  labels: {
    Dribble: "A",
    Defense: "S"
  }
}

// ホットキー設定を保存
export const saveHotkeysToStorage = (hotkeys: HotkeyConfig) => {
  localStorage.setItem(HOTKEYS_STORAGE_KEY, JSON.stringify(hotkeys))
}

// ホットキー設定を読み込み
export const loadHotkeysFromStorage = (): HotkeyConfig => {
  const storedHotkeys = localStorage.getItem(HOTKEYS_STORAGE_KEY)
  return storedHotkeys ? JSON.parse(storedHotkeys) : defaultHotkeys
}
