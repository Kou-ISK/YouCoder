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
    "team" | "buttonSet" | "buttonInSet" | "addAction" | "addLabel" | null
  >(null)
  const [showExtension, setShowExtension] = useState<boolean>(true)
  const [selectedButtonSet, setSelectedButtonSet] = useState<string>("RUGBY")
  const [buttonSets, setButtonSets] = useState<ButtonSet[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await chrome.storage.local.get([
          "teams",
          "showExtension",
          "buttonSets",
          "selectedButtonSet",
          "selectedAction"
        ])
        console.log("Loaded data from chrome.storage:", data)

        setTeams(data.teams || [])
        setShowExtension(
          data.showExtension !== undefined ? data.showExtension : true
        )
        const loadedButtonSets = data.buttonSets || defaultButtonSets
        setButtonSets(loadedButtonSets)

        // selectedButtonSetの初期化を確実に行う
        let initialSelectedButtonSet = data.selectedButtonSet
        if (
          !initialSelectedButtonSet &&
          loadedButtonSets &&
          loadedButtonSets.length > 0
        ) {
          initialSelectedButtonSet = loadedButtonSets[0].setName
        }

        console.log("Setting selectedButtonSet to:", initialSelectedButtonSet)
        setSelectedButtonSet(initialSelectedButtonSet || "")

        if (data.selectedAction) {
          setSelectedAction(data.selectedAction)
        }

        console.log("Data loading completed. Final states:", {
          selectedButtonSet: initialSelectedButtonSet,
          buttonSets: loadedButtonSets,
          teams: data.teams || []
        })
      } catch (error) {
        console.error("Failed to load data:", error)
        alert(
          "設定データの読み込みに失敗しました。拡張機能を再読み込みしてください。"
        )
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // データ読み込み完了後にselectedButtonSetを確実に設定
  useEffect(() => {
    if (
      !isLoading &&
      buttonSets.length > 0 &&
      (!selectedButtonSet || selectedButtonSet.trim() === "")
    ) {
      console.log(
        "Force setting selectedButtonSet to first available:",
        buttonSets[0].setName
      )
      setSelectedButtonSet(buttonSets[0].setName)
      chrome.storage.local.set({ selectedButtonSet: buttonSets[0].setName })
    }
  }, [isLoading, buttonSets, selectedButtonSet])

  // デバッグ用: selectedButtonSetの変更を監視
  useEffect(() => {
    console.log("selectedButtonSet changed:", selectedButtonSet)
  }, [selectedButtonSet])

  // ボタン追加時にどのボタンセットに追加するかを管理するstate
  const [targetButtonSetForAdd, setTargetButtonSetForAdd] = useState<
    string | null
  >(null)

  const openModal = (
    type: "team" | "buttonSet" | "buttonInSet" | "addAction" | "addLabel"
  ) => {
    console.log("=== openModal called ===")
    console.log("Type:", type)
    console.log(
      "Selected ButtonSet:",
      selectedButtonSet,
      "type:",
      typeof selectedButtonSet,
      "length:",
      selectedButtonSet ? selectedButtonSet.length : 0
    )
    console.log("ButtonSets:", buttonSets)
    console.log("ButtonSets length:", buttonSets.length)

    if (!selectedButtonSet && (type === "addAction" || type === "addLabel")) {
      console.log(
        "ボタンセットが選択されていません - selectedButtonSet:",
        selectedButtonSet
      )
      alert("ボタンセットを選択してください")
      return
    }
    if (type === "addLabel" && !selectedAction) {
      console.log("アクションが選択されていません")
      alert("ラベルを追加するアクションを選択してください")
      return
    }
    console.log("モーダルを開いています:", type)
    console.log("Setting modalType to:", type)
    console.log("Setting modalInput to empty string")
    console.log("Setting isModalOpen to true")

    setModalType(type)
    setModalInput("")
    setIsModalOpen(true)

    console.log("モーダル状態設定完了:", {
      isModalOpen: true,
      modalType: type,
      modalInput: ""
    })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalType(null)
    setModalInput("")
  }

  const handleModalSubmit = async () => {
    console.log("=== handleModalSubmit START ===")
    console.log("handleModalSubmit called", {
      modalType,
      modalInput,
      selectedButtonSet,
      selectedAction,
      modalInputTrimmed: modalInput.trim()
    })

    if (!modalInput.trim()) {
      console.log("modalInput is empty or whitespace only, returning")
      return
    }

    switch (modalType) {
      case "addAction":
        {
          console.log("Processing addAction case")
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

          // ボタンセット全体と選択状態を同時に保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: selectedButtonSet
          })
          setButtonSets(updatedButtonSets)
          console.log("Action added and saved to localStorage:", modalInput)
        }
        break
      case "addLabel":
        {
          console.log("Processing addLabel case")
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

          // ボタンセット全体と選択状態を同時に保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: selectedButtonSet,
            selectedAction: selectedAction
          })
          setButtonSets(updatedButtonSets)
          console.log("Label added and saved to localStorage:", modalInput)
        }
        break
      case "team":
        {
          console.log("Processing team case")
          const updatedTeams = [...teams, modalInput]
          await chrome.storage.local.set({ teams: updatedTeams })
          setTeams(updatedTeams)
        }
        break
      case "buttonSet":
        {
          console.log("Processing buttonSet case")
          if (buttonSets.find((set) => set.setName === modalInput)) {
            alert("同名のボタンセットが既に存在します")
            return
          }
          const updatedButtonSets = [
            ...buttonSets,
            { setName: modalInput, buttons: [] }
          ]

          // 新しいボタンセットを作成し、それを選択状態にして保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: modalInput
          })
          setButtonSets(updatedButtonSets)
          setSelectedButtonSet(modalInput)
          console.log(
            "ButtonSet created and saved to localStorage:",
            modalInput
          )
        }
        break
    }
    console.log("Modal submit completed, closing modal")
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
          onChange={async (e) => {
            console.log(
              "Select changed from",
              selectedButtonSet,
              "to",
              e.target.value
            )
            setSelectedButtonSet(e.target.value)
            // 選択変更時に即座にlocalStorageに保存
            await chrome.storage.local.set({
              selectedButtonSet: e.target.value
            })
            console.log(
              "Selected button set saved to localStorage:",
              e.target.value
            )
          }}
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
          onClick={() => {
            console.log("=== アクション追加ボタンクリック ===")
            console.log("現在の状態:", {
              selectedButtonSet,
              buttonSets,
              isModalOpen,
              modalType
            })
            openModal("addAction")
          }}>
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
          onClick={() => {
            console.log("=== ラベル追加ボタンクリック ===")
            console.log("現在の状態:", {
              selectedButtonSet,
              selectedAction,
              buttonSets,
              isModalOpen,
              modalType
            })
            openModal("addLabel")
          }}>
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
        selectedAction={selectedAction}
        onUpdateButtonSet={async (updatedSet) => {
          const updatedButtonSets = buttonSets.map((set) =>
            set.setName === updatedSet.setName ? updatedSet : set
          )
          setButtonSets(updatedButtonSets)

          // ボタンセット全体と選択状態を同時に保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: selectedButtonSet
          })
          console.log(
            "ButtonSet updated and saved to localStorage:",
            updatedSet.setName
          )
        }}
        onActionSelect={async (action) => {
          console.log("Action selected:", action)
          setSelectedAction(action)
          // アクション選択変更時に即座にlocalStorageに保存
          await chrome.storage.local.set({ selectedAction: action })
          console.log("Selected action saved to localStorage:", action)
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
        modalType={modalType}
        onInputChange={(value) => {
          console.log("Modal input changed:", value)
          setModalInput(value)
        }}
        onClose={() => {
          console.log("Modal close called")
          closeModal()
        }}
        onSubmit={() => {
          console.log("Modal submit called")
          handleModalSubmit()
        }}
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
