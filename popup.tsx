import React, { useEffect, useState } from "react"

import ButtonSetComponent from "./components/Popup/ButtonSetComponent"
import { Modal } from "./components/Popup/Modal"
import { TeamList } from "./components/Popup/TeamList"
import { appendToSheet, getAuthUrl, setCredentials } from "./lib/sheets"

type Button = {
  action: string
  labels: string[]
}

type ButtonSet = {
  setName: string
  buttons: Button[]
}

const defaultButtonSets: ButtonSet[] = [
  {
    setName: "A",
    buttons: [
      {
        action: "fuga",
        labels: ["hogehoge", "fugafuga"]
      }
    ]
  },
  {
    setName: "B",
    buttons: [
      {
        action: "bar",
        labels: ["barラベル1", "barラベル2"]
      }
    ]
  }
]

const Popup = () => {
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [teams, setTeams] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInput, setModalInput] = useState("")
  const [modalType, setModalType] = useState<
    "team" | "buttonSet" | "buttonInSet" | "addAction" | "addLabel"
  >("buttonSet")
  const [showExtension, setShowExtension] = useState<boolean>(true)
  const [selectedButtonSet, setSelectedButtonSet] = useState<string>("A")
  const [buttonSets, setButtonSets] = useState<ButtonSet[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await chrome.storage.local.get([
          "teams",
          "showExtension",
          "buttonSets",
          "selectedButtonSet",
          "selectedAction"
        ])
        setTeams(data.teams || [])
        setShowExtension(
          data.showExtension !== undefined ? data.showExtension : true
        )
        setButtonSets(data.buttonSets || defaultButtonSets)
        if (data.selectedButtonSet) {
          setSelectedButtonSet(data.selectedButtonSet)
        } else if (data.buttonSets && data.buttonSets.length > 0) {
          setSelectedButtonSet(data.buttonSets[0].setName)
        }
        if (data.selectedAction) {
          setSelectedAction(data.selectedAction)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        alert(
          "設定データの読み込みに失敗しました。拡張機能を再読み込みしてください。"
        )
      }
    }
    loadData()
  }, [])

  // ボタン追加時にどのボタンセットに追加するかを管理するstate
  const [targetButtonSetForAdd, setTargetButtonSetForAdd] = useState<
    string | null
  >(null)

  const openModal = (
    type: "team" | "buttonSet" | "buttonInSet" | "addAction" | "addLabel"
  ) => {
    if (!selectedButtonSet && (type === "addAction" || type === "addLabel")) {
      alert("ボタンセットを選択してください")
      return
    }
    if (type === "addLabel" && !selectedAction) {
      alert("ラベルを追加するアクションを選択してください")
      return
    }
    if (type === "buttonSet") {
      setModalType("buttonSet")
    } else if (type === "buttonInSet") {
      setModalType("buttonInSet")
    } else if (type === "addAction") {
      setModalType("addAction")
    } else if (type === "addLabel") {
      setModalType("addLabel")
    } else {
      setModalType(type)
    }
    setModalInput("")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalType(null)
  }

  const handleModalSubmit = async () => {
    if (!modalInput) return

    switch (modalType) {
      case "addAction":
        {
          if (!selectedButtonSet) {
            alert("アクションを追加するボタンセットが選択されていません")
            return
          }
          const targetSetIndex = buttonSets.findIndex(
            (set) => set.setName === selectedButtonSet
          )
          if (targetSetIndex === -1) {
            alert("選択中のボタンセットが存在しません")
            return
          }
          const updatedButtonSets = [...buttonSets]
          updatedButtonSets[targetSetIndex].buttons.push({
            action: modalInput,
            labels: []
          })
          await chrome.storage.local.set({ buttonSets: updatedButtonSets })
          setButtonSets(updatedButtonSets)
          // 新規追加時に自動選択しないように変更
          // setSelectedAction(modalInput) // 追加したアクションを選択状態にする
        }
        break
      case "addLabel":
        {
          if (!selectedButtonSet) {
            alert("ラベルを追加するボタンセットが選択されていません")
            return
          }
          if (!selectedAction) {
            alert("ラベルを追加するアクションが選択されていません")
            return
          }
          const targetSetIndex = buttonSets.findIndex(
            (set) => set.setName === selectedButtonSet
          )
          if (targetSetIndex === -1) {
            alert("選択中のボタンセットが存在しません")
            return
          }
          // ラベルは選択中のアクションに紐づける
          const updatedButtonSets = [...buttonSets]
          const buttons = updatedButtonSets[targetSetIndex].buttons
          const targetButtonIndex = buttons.findIndex(
            (btn) => btn.action === selectedAction
          )
          if (targetButtonIndex === -1) {
            alert("選択中のアクションが存在しません")
            return
          }
          buttons[targetButtonIndex].labels.push(modalInput)
          await chrome.storage.local.set({ buttonSets: updatedButtonSets })
          setButtonSets(updatedButtonSets)
        }
        break
      case "team":
        {
          const updatedTeams = [...teams, modalInput]
          await chrome.storage.local.set({ teams: updatedTeams })
          setTeams(updatedTeams)
        }
        break
      case "buttonSet":
        {
          if (buttonSets.find((set) => set.setName === modalInput)) {
            alert("同名のボタンセットが既に存在します")
            return
          }
          const updatedButtonSets = [
            ...buttonSets,
            { setName: modalInput, buttons: [] }
          ]
          await chrome.storage.local.set({ buttonSets: updatedButtonSets })
          setButtonSets(updatedButtonSets)
        }
        break
    }
    closeModal()
  }

  const handleRemoveItem = async (type: "team" | "buttonSet", key: string) => {
    switch (type) {
      case "team": {
        const updatedTeams = teams.filter((team) => team !== key)
        await chrome.storage.local.set({ teams: updatedTeams })
        setTeams(updatedTeams)
        break
      }
      case "buttonSet": {
        const updatedButtonSets = buttonSets.filter(
          (set) => set.setName !== key
        )
        await chrome.storage.local.set({ buttonSets: updatedButtonSets })
        setButtonSets(updatedButtonSets)
        if (selectedButtonSet === key && updatedButtonSets.length > 0) {
          setSelectedButtonSet(updatedButtonSets[0].setName)
        }
        break
      }
    }
  }

  const handleSave = async () => {
    try {
      await chrome.storage.local.set({
        teams,
        showExtension,
        buttonSets,
        selectedButtonSet
      })
      ;(chrome as any).runtime.sendMessage({
        type: "EXTENSION_VISIBILITY_UPDATED"
      })
      window.close()
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("設定の保存に失敗しました。もう一度お試しください。")
    }
  }

  const handleVisibilityToggle = async () => {
    const newVisibility = !showExtension
    setShowExtension(newVisibility)
    try {
      await chrome.storage.local.set({ showExtension: newVisibility })
      ;(chrome as any).runtime.sendMessage({
        type: "EXTENSION_VISIBILITY_UPDATED"
      })
    } catch (error) {
      console.error("Failed to update visibility:", error)
      alert("表示設定の更新に失敗しました。ページを再読み込みしてください。")
    }
  }

  // ボタンセット切り替えUI
  const renderButtonSetSelector = () => (
    <div
      style={{
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px"
        }}>
        <label
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#374151",
            minWidth: "80px"
          }}>
          ボタンセット:
        </label>
        <select
          value={selectedButtonSet}
          onChange={(e) => setSelectedButtonSet(e.target.value)}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "white",
            color: "#374151",
            cursor: "pointer",
            flex: "1"
          }}>
          {buttonSets.map((set) => (
            <option key={set.setName} value={set.setName}>
              {set.setName}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px"
        }}>
        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#2563eb")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#3b82f6")
          }
          onClick={() => openModal("buttonSet")}>
          追加
        </button>

        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ef4444")
          }
          onClick={() => handleRemoveItem("buttonSet", selectedButtonSet)}>
          削除
        </button>

        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#059669")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#10b981")
          }
          onClick={() => openModal("addAction")}>
          アクション追加
        </button>

        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#d97706")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#f59e0b")
          }
          onClick={() => openModal("addLabel")}>
          ラベル追加
        </button>
      </div>
    </div>
  )

  return (
    <div
      style={{
        minWidth: "450px",
        padding: "24px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#fafafa",
        borderRadius: "8px"
      }}>
      <h2
        style={{
          margin: "0 0 24px 0",
          fontSize: "20px",
          fontWeight: "600",
          color: "#1a1a1a",
          letterSpacing: "-0.025em"
        }}>
        設定
      </h2>
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => {
            setShowExtension((prev) => !prev)
            handleVisibilityToggle()
          }}
          style={{
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: showExtension ? "#ef4444" : "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s ease",
            boxShadow: showExtension
              ? "0 2px 4px rgba(239, 68, 68, 0.2)"
              : "0 2px 4px rgba(34, 197, 94, 0.2)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = showExtension
              ? "0 4px 8px rgba(239, 68, 68, 0.3)"
              : "0 4px 8px rgba(34, 197, 94, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = showExtension
              ? "0 2px 4px rgba(239, 68, 68, 0.2)"
              : "0 2px 4px rgba(34, 197, 94, 0.2)"
          }}>
          {showExtension ? "拡張機能を非表示にする" : "拡張機能を表示する"}
        </button>
      </div>
      {renderButtonSetSelector()}
      <ButtonSetComponent
        buttonSet={buttonSets.find((set) => set.setName === selectedButtonSet)}
        onUpdateButtonSet={(updatedSet) => {
          const updatedButtonSets = buttonSets.map((set) =>
            set.setName === updatedSet.setName ? updatedSet : set
          )
          setButtonSets(updatedButtonSets)
          chrome.storage.local.set({ buttonSets: updatedButtonSets })
          // 選択中のボタンセットも更新
          if (selectedButtonSet === updatedSet.setName) {
            chrome.storage.local.set({ selectedButtonSet: updatedSet.setName })
          }
        }}
      />
      <TeamList
        teams={teams}
        onAdd={() => openModal("team")}
        onRemove={(team) => handleRemoveItem("team", team)}
      />
      <Modal
        isOpen={isModalOpen}
        inputValue={modalInput}
        modalType={
          modalType as
            | "team"
            | "buttonSet"
            | "buttonInSet"
            | "addAction"
            | "addLabel"
        }
        onInputChange={setModalInput}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
      <div style={{ marginTop: "24px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#16a34a"
            e.currentTarget.style.transform = "translateY(-1px)"
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(34, 197, 94, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#22c55e"
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(34, 197, 94, 0.2)"
          }}>
          保存して閉じる
        </button>
      </div>
    </div>
  )
}

export default Popup
