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
    }
  }

  // ボタンセット切り替えUI
  const renderButtonSetSelector = () => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ marginRight: "8px" }}>ボタンセット:</label>
      <select
        value={selectedButtonSet}
        onChange={(e) => setSelectedButtonSet(e.target.value)}>
        {buttonSets.map((set) => (
          <option key={set.setName} value={set.setName}>
            {set.setName}
          </option>
        ))}
      </select>
      <button
        style={{
          marginLeft: "8px",
          padding: "4px 8px",
          cursor: "pointer"
        }}
        onClick={() => openModal("buttonSet")}>
        追加
      </button>
      <button
        style={{
          marginLeft: "8px",
          padding: "4px 8px",
          cursor: "pointer"
        }}
        onClick={() => handleRemoveItem("buttonSet", selectedButtonSet)}>
        削除
      </button>
      <button
        style={{
          marginLeft: "8px",
          padding: "4px 8px",
          cursor: "pointer"
        }}
        onClick={() => openModal("addAction")}>
        アクション追加
      </button>
      <button
        style={{
          marginLeft: "8px",
          padding: "4px 8px",
          cursor: "pointer"
        }}
        onClick={() => openModal("addLabel")}>
        ラベル追加
      </button>
    </div>
  )

  return (
    <div style={{ minWidth: "400px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>設定</h2>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => {
            setShowExtension((prev) => !prev)
            handleVisibilityToggle()
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: showExtension ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%"
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
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%"
          }}>
          保存して閉じる
        </button>
      </div>
    </div>
  )
}

export default Popup
