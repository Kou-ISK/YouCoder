import { Modal } from "components/Modal"
import React, { useEffect, useState } from "react"

import ButtonSetComponent from "./components/Popup/ButtonSetComponent"
import { TeamList } from "./components/Popup/TeamList"
import {
  CHROME_EXTENSION,
  NOTIFICATION,
  PANEL_POSITION,
  PANEL_SIZE,
  STYLES
} from "./constants"
import type {
  Button,
  ButtonSet,
  ChromeStorageData,
  ModalType,
  Notification
} from "./types/common"
import { logger } from "./utils/errorHandling"
import { getLabelList, parseLabel } from "./utils/labelUtils"

const defaultButtonSets: ButtonSet[] = [
  {
    setName: "A",
    buttons: [
      {
        action: "fuga",
        labels: { Result: ["hogehoge", "fugafuga"] }
      }
    ]
  },
  {
    setName: "B",
    buttons: [
      {
        action: "bar",
        labels: { Type: ["barラベル1", "barラベル2"] }
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
  const [modalType, setModalType] = useState<ModalType>(null)
  const [showExtension, setShowExtension] = useState<boolean>(true)
  const [selectedButtonSet, setSelectedButtonSet] = useState<string>("RUGBY")
  const [buttonSets, setButtonSets] = useState<ButtonSet[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(
    null
  )
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleShowNotification = (
    message: string,
    type: Notification["type"] = "info"
  ) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), NOTIFICATION.DISPLAY_DURATION)
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data: ChromeStorageData = await chrome.storage.local.get([
          CHROME_EXTENSION.STORAGE_KEYS.TEAMS,
          CHROME_EXTENSION.STORAGE_KEYS.SHOW_EXTENSION,
          CHROME_EXTENSION.STORAGE_KEYS.BUTTON_SETS,
          CHROME_EXTENSION.STORAGE_KEYS.SELECTED_BUTTON_SET,
          CHROME_EXTENSION.STORAGE_KEYS.SELECTED_ACTION
        ])

        logger.info("Loaded data from chrome.storage", data)

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

        logger.info("Setting selectedButtonSet to:", initialSelectedButtonSet)
        setSelectedButtonSet(initialSelectedButtonSet || "")

        if (data.selectedAction) {
          setSelectedAction(data.selectedAction)
        }

        logger.info("Data loading completed. Final states:", {
          selectedButtonSet: initialSelectedButtonSet,
          buttonSets: loadedButtonSets,
          teams: data.teams || []
        })
      } catch (error) {
        logger.error("Failed to load data", error)
        handleShowNotification(
          "設定データの読み込みに失敗しました。拡張機能を再読み込みしてください。",
          "error"
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
      logger.info(
        "Force setting selectedButtonSet to first available:",
        buttonSets[0].setName
      )
      setSelectedButtonSet(buttonSets[0].setName)
      chrome.storage.local.set({ selectedButtonSet: buttonSets[0].setName })
    }
  }, [isLoading, buttonSets, selectedButtonSet])

  // デバッグ用: selectedButtonSetの変更を監視
  useEffect(() => {
    logger.debug("selectedButtonSet changed:", selectedButtonSet)
  }, [selectedButtonSet])

  // ボタン追加時にどのボタンセットに追加するかを管理するstate
  const [targetButtonSetForAdd, setTargetButtonSetForAdd] = useState<
    string | null
  >(null)

  const openModal = (
    type: "team" | "buttonSet" | "buttonInSet" | "addAction" | "addLabel"
  ) => {
    logger.debug("=== openModal called ===", {
      type,
      selectedButtonSet,
      buttonSetsLength: buttonSets.length
    })

    if (!selectedButtonSet && (type === "addAction" || type === "addLabel")) {
      logger.warn("ボタンセットが選択されていません", { selectedButtonSet })
      alert("ボタンセットを選択してください")
      return
    }
    if (type === "addLabel" && !selectedAction) {
      logger.warn("アクションが選択されていません")
      alert("ラベルを追加するアクションを選択してください")
      return
    }
    logger.debug("モーダルを開いています", { type })

    setModalType(type)
    setModalInput("")
    setIsModalOpen(true)

    logger.debug("モーダル状態設定完了", {
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

  const handleModalSubmit = async (category?: string) => {
    logger.debug("=== handleModalSubmit START ===", {
      modalType,
      modalInput,
      selectedButtonSet,
      selectedAction,
      category,
      modalInputTrimmed: modalInput.trim()
    })

    if (!modalInput.trim()) {
      logger.warn("modalInput is empty or whitespace only, returning")
      return
    }

    switch (modalType) {
      case "addAction":
        {
          logger.debug("Processing addAction case")
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
            labels: {} // 空のRecord<string, string[]>
          })

          // ボタンセット全体と選択状態を同時に保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: selectedButtonSet
          })
          setButtonSets(updatedButtonSets)
          logger.info("Action added and saved to localStorage", { modalInput })
        }
        break
      case "addLabel":
        {
          logger.debug(`Processing ${modalType} case`)
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

          const updatedButtonSets = [...buttonSets]
          const buttons = updatedButtonSets[targetSetIndex].buttons
          const targetButtonIndex = buttons.findIndex(
            (btn) => btn.action === selectedAction
          )
          if (targetButtonIndex === -1) {
            alert("選択中のアクションが存在しません")
            return
          }

          // ラベルを選択中のアクションに紐づける
          const targetButton = buttons[targetButtonIndex]

          if (modalType === "addLabel" && category) {
            // ラベルの場合のみサポート
            const labels = targetButton.labels as Record<string, string[]>

            if (!labels[category]) {
              labels[category] = []
            }

            // 重複チェック
            if (!labels[category].includes(modalInput)) {
              labels[category].push(modalInput)
              targetButton.labels = labels
              logger.info(`ラベル追加: ${category} - ${modalInput}`)
            } else {
              alert(
                `ラベル "${modalInput}" は既にカテゴリ "${category}" に存在します`
              )
              return
            }
          } else {
            // カテゴリが指定されていない場合
            alert("ラベルを追加するにはカテゴリの指定が必要です。")
            return
          }

          // ボタンセット全体と選択状態を同時に保存
          await chrome.storage.local.set({
            buttonSets: updatedButtonSets,
            selectedButtonSet: selectedButtonSet,
            selectedAction: selectedAction
          })
          setButtonSets(updatedButtonSets)
          logger.info("Label added and saved to localStorage", { modalInput })
        }
        break
      case "team":
        {
          logger.debug("Processing team case")
          const updatedTeams = [...teams, modalInput]
          await chrome.storage.local.set({ teams: updatedTeams })
          setTeams(updatedTeams)
        }
        break
      case "buttonSet":
        {
          logger.debug("Processing buttonSet case")
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
          logger.debug(
            "ButtonSet created and saved to localStorage:",
            modalInput
          )
        }
        break
    }
    logger.debug("Modal submit completed, closing modal")
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
      logger.error("Failed to save settings:", error)
      alert("設定の保存に失敗しました。もう一度お試しください。")
    }
  }

  const handleJsonImport = () => {
    logger.debug("JSON import button clicked")

    // 隠れたファイル入力要素を作成
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.style.display = "none"

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        logger.debug("No file selected")
        return
      }

      try {
        const fileContent = await file.text()
        logger.debug("File content:", fileContent)

        const importedData = JSON.parse(fileContent)
        logger.debug("Parsed JSON:", importedData)

        // バリデーション：単一のボタンセットオブジェクトかチェック
        if (!importedData.setName || typeof importedData.setName !== "string") {
          handleShowNotification(
            "無効なファイル形式です。ボタンセットには setName が必要です。",
            "error"
          )
          return
        }

        if (!Array.isArray(importedData.buttons)) {
          handleShowNotification(
            "無効なファイル形式です。ボタンセットには buttons 配列が必要です。",
            "error"
          )
          return
        }

        // ボタンのバリデーション
        const validButtons: Button[] = []
        let hasErrors = false

        for (const button of importedData.buttons) {
          if (!button.action || typeof button.action !== "string") {
            logger.debug("Invalid button action:", button)
            hasErrors = true
            continue
          }

          // ラベルの型チェック：Record<string, string[]> をサポート
          let validLabels: Record<string, string[]>

          if (
            typeof button.labels === "object" &&
            button.labels !== null &&
            !Array.isArray(button.labels)
          ) {
            // ラベル形式：Record<string, string[]>
            const validCategories: Record<string, string[]> = {}
            let categoryHasErrors = false

            for (const [category, labelList] of Object.entries(button.labels)) {
              if (typeof category !== "string") {
                logger.debug("Invalid category name:", category)
                categoryHasErrors = true
                continue
              }

              if (!Array.isArray(labelList)) {
                logger.debug("Invalid label list for category", {
                  category,
                  labelList
                })
                categoryHasErrors = true
                continue
              }

              const validCategoryLabels = labelList.filter(
                (label: any) => typeof label === "string"
              )

              if (validCategoryLabels.length !== labelList.length) {
                logger.debug("Some labels in category are not strings", {
                  category,
                  labelList
                })
                categoryHasErrors = true
              }

              if (validCategoryLabels.length > 0) {
                validCategories[category] = validCategoryLabels
              }
            }

            if (categoryHasErrors) {
              hasErrors = true
            }

            validLabels = validCategories
          } else {
            logger.debug("Invalid button labels format:", button.labels)
            hasErrors = true
            continue
          }

          validButtons.push({
            action: button.action,
            labels: validLabels
          })
        }

        if (hasErrors) {
          const proceed = confirm(
            "ファイルに無効なデータが含まれています。有効なデータのみをインポートしますか？"
          )
          if (!proceed) {
            return
          }
        }

        const validButtonSet: ButtonSet = {
          setName: importedData.setName,
          buttons: validButtons
        }

        // 既存のボタンセットと重複チェック
        const existingSetIndex = buttonSets.findIndex(
          (set) => set.setName === validButtonSet.setName
        )

        if (existingSetIndex !== -1) {
          const proceed = confirm(
            `ボタンセット "${validButtonSet.setName}" は既に存在します。\n上書きしてインポートを続行しますか？`
          )
          if (!proceed) {
            return
          }
        }

        // ボタンセットを追加または上書き
        const updatedButtonSets = [...buttonSets]
        if (existingSetIndex !== -1) {
          updatedButtonSets[existingSetIndex] = validButtonSet
        } else {
          updatedButtonSets.push(validButtonSet)
        }

        // データを保存
        await chrome.storage.local.set({
          buttonSets: updatedButtonSets
        })

        setButtonSets(updatedButtonSets)

        // インポートしたボタンセットを選択
        setSelectedButtonSet(validButtonSet.setName)
        await chrome.storage.local.set({
          selectedButtonSet: validButtonSet.setName
        })

        handleShowNotification(
          `ボタンセット "${validButtonSet.setName}" を正常にインポートしました。`,
          "success"
        )
        logger.debug("Import completed successfully:", validButtonSet)
      } catch (error) {
        logger.error("JSON parse error:", error)
        handleShowNotification(
          "JSONファイルの解析に失敗しました。ファイル形式を確認してください。",
          "error"
        )
      }

      // cleanup
      document.body.removeChild(input)
    }

    document.body.appendChild(input)
    input.click()
  }

  const handleJsonExport = () => {
    logger.debug("JSON export button clicked")

    try {
      // 選択されたボタンセットのみをエクスポート
      const selectedSet = buttonSets.find(
        (set) => set.setName === selectedButtonSet
      )
      if (!selectedSet) {
        handleShowNotification(
          "エクスポートするボタンセットが選択されていません。",
          "error"
        )
        return
      }

      const dataToExport = selectedSet
      const jsonString = JSON.stringify(dataToExport, null, 2)

      // Blobを作成してダウンロードリンクを生成
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // 隠れたダウンロードリンクを作成
      const link = document.createElement("a")
      link.href = url
      link.download = `${selectedSet.setName}.json`
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // URLオブジェクトをクリーンアップ
      URL.revokeObjectURL(url)

      handleShowNotification("ボタンセットをエクスポートしました。", "success")
      logger.debug("Export completed successfully")
    } catch (error) {
      logger.error("Export error:", error)
      handleShowNotification("エクスポートに失敗しました。", "error")
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
      logger.error("Failed to update visibility:", error)
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
            logger.debug("Select changed", {
              from: selectedButtonSet,
              to: e.target.value
            })
            setSelectedButtonSet(e.target.value)
            // 選択変更時に即座にlocalStorageに保存
            await chrome.storage.local.set({
              selectedButtonSet: e.target.value
            })
            logger.debug("Selected button set saved to localStorage", {
              value: e.target.value
            })
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
          gap: "8px",
          marginBottom: "8px"
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
          セット追加
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
          セット削除
        </button>

        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#7c3aed")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#8b5cf6")
          }
          onClick={handleJsonImport}>
          インポート
        </button>

        <button
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#4b5563")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6b7280")
          }
          onClick={handleJsonExport}>
          エクスポート
        </button>
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
            logger.debug("=== アクション追加ボタンクリック ===")
            logger.debug("現在の状態:", {
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
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#7c3aed")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#8b5cf6")
          }
          onClick={() => {
            logger.debug("=== カテゴリ付きラベル追加ボタンクリック ===")
            logger.debug("現在の状態:", {
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
        minWidth: PANEL_SIZE.MIN_WIDTH,
        padding: STYLES.PADDING.LARGE,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: STYLES.COLORS.BACKGROUND,
        borderRadius: STYLES.BORDER_RADIUS.LARGE,
        position: "relative"
      }}>
      {/* 通知 */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: PANEL_POSITION.NOTIFICATION_Z_INDEX,
            padding: STYLES.PADDING.SMALL,
            borderRadius: STYLES.BORDER_RADIUS.LARGE,
            fontSize: STYLES.FONT_SIZE.MEDIUM,
            fontWeight: "500",
            color: STYLES.COLORS.WHITE,
            backgroundColor:
              notification.type === "success"
                ? STYLES.COLORS.SUCCESS
                : notification.type === "error"
                  ? STYLES.COLORS.ERROR
                  : STYLES.COLORS.PRIMARY,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transform: "translateX(0)",
            transition: "transform 0.3s ease, opacity 0.3s ease",
            opacity: 1
          }}>
          {notification.message}
        </div>
      )}

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
          logger.debug(
            "ButtonSet updated and saved to localStorage:",
            updatedSet.setName
          )
        }}
        onActionSelect={async (action) => {
          logger.debug("Action selected:", action)
          setSelectedAction(action)
          // アクション選択変更時に即座にlocalStorageに保存
          await chrome.storage.local.set({ selectedAction: action })
          logger.debug("Selected action saved to localStorage:", action)
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
          logger.debug("Modal input changed:", value)
          setModalInput(value)
        }}
        onClose={() => {
          logger.debug("Modal close called")
          closeModal()
        }}
        onSubmit={(category) => {
          logger.debug("Modal submit called with category:", category)
          handleModalSubmit(category)
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
