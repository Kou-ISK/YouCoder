import React, { useEffect, useState } from "react"

import {
  loadHotkeysFromStorage,
  saveHotkeysToStorage,
  type HotkeyConfig
} from "./lib/hotkeys"
import { appendToSheet, getAuthUrl, setCredentials } from "./lib/sheets"

const Popup = () => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(loadHotkeysFromStorage())
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [actions, setActions] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [teams, setTeams] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInput, setModalInput] = useState("")
  const [modalType, setModalType] = useState<
    "action" | "label" | "team" | null
  >(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await chrome.storage.local.get([
          "actions",
          "labels",
          "teams"
        ])
        setActions(data.actions || {})
        setLabels(data.labels || {})
        setTeams(data.teams || [])
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    loadData()
  }, [])

  const handleHotkeyChange = (
    type: "actions" | "labels",
    key: string,
    value: string
  ) => {
    setHotkeys((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }))
  }

  const openModal = (type: "action" | "label" | "team") => {
    setModalType(type)
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
      case "action":
        const updatedActions = { ...actions, [modalInput]: "" }
        await chrome.storage.local.set({ actions: updatedActions })
        setActions(updatedActions)
        break
      case "label":
        const updatedLabels = { ...labels, [modalInput]: "" }
        await chrome.storage.local.set({ labels: updatedLabels })
        setLabels(updatedLabels)
        break
      case "team":
        const updatedTeams = [...teams, modalInput]
        await chrome.storage.local.set({ teams: updatedTeams })
        setTeams(updatedTeams)
        break
    }
    closeModal()
  }

  const handleRemoveTeam = async (teamName: string) => {
    const updatedTeams = teams.filter((team) => team !== teamName)
    await chrome.storage.local.set({ teams: updatedTeams })
    setTeams(updatedTeams)
  }

  const handleSave = async () => {
    try {
      saveHotkeysToStorage(hotkeys)
      await chrome.storage.local.set({
        actions,
        labels
      })
      alert("Settings saved!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings!")
    }
  }

  const handleAuth = async () => {
    const url = await getAuthUrl() // Await the promise to resolve
    setAuthUrl(url)
    window.open(url, "_blank")
  }

  const handleSetCredentials = async () => {
    const code = prompt("Enter the authorization code:")
    if (code) {
      await setCredentials(code)
      alert("Authorization successful!")
    }
  }

  const handleExportToSheet = async () => {
    if (!spreadsheetId) {
      alert("Please enter a Spreadsheet ID.")
      return
    }
    try {
      const data = [
        ["Action", "Label", "Start Time", "End Time"],
        // Example data, replace with actual actions
        ["Jump", "Athletics", "00:01:23", "00:01:30"]
      ]
      await appendToSheet(spreadsheetId, "Sheet1!A1", data)
      alert("Data exported successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to export data.")
    }
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h3>Teams</h3>
        <div>
          {teams.map((team) => (
            <div
              key={team}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem"
              }}>
              <span>{team}</span>
              <button
                onClick={() => handleRemoveTeam(team)}
                style={{ marginLeft: "1rem", padding: "0.2rem 0.5rem" }}>
                削除
              </button>
            </div>
          ))}
          <button onClick={() => openModal("team")}>チームを追加</button>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Actions</h3>
        {Object.entries(hotkeys.actions).map(([action, key]) => (
          <div key={action}>
            <label>
              {action}:{" "}
              <input
                type="text"
                value={key}
                onChange={(e) =>
                  handleHotkeyChange("actions", action, e.target.value)
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Labels</h3>
        {Object.entries(hotkeys.labels).map(([label, key]) => (
          <div key={label}>
            <label>
              {label}:{" "}
              <input
                type="text"
                value={key}
                onChange={(e) =>
                  handleHotkeyChange("labels", label, e.target.value)
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Google Sheets Integration</h3>
        <div>
          <label>
            Spreadsheet ID:{" "}
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
          </label>
        </div>
        <button onClick={handleAuth} style={{ marginTop: "1rem" }}>
          Authenticate with Google
        </button>
        <button onClick={handleSetCredentials} style={{ marginTop: "1rem" }}>
          Set Credentials
        </button>
        <button onClick={handleExportToSheet} style={{ marginTop: "1rem" }}>
          Export to Google Sheets
        </button>
      </div>

      <button onClick={handleSave} style={{ marginTop: "1rem" }}>
        Save Hotkeys
      </button>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "1rem",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            borderRadius: "4px"
          }}>
          <h4>
            {modalType === "team"
              ? "チームを追加"
              : modalType === "action"
                ? "アクションを追加"
                : "ラベルを追加"}
          </h4>
          <input
            type="text"
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            placeholder={
              modalType === "team"
                ? "チーム名"
                : modalType === "action"
                  ? "アクション名"
                  : "ラベル名"
            }
          />
          <div style={{ marginTop: "1rem" }}>
            <button onClick={handleModalSubmit}>保存</button>
            <button onClick={closeModal} style={{ marginLeft: "0.5rem" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Popup
