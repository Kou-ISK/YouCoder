import React, { useEffect, useState } from "react"

import { appendToSheet, getAuthUrl, setCredentials } from "./lib/sheets"

const Popup = () => {
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
        const updatedActions = { ...actions, [modalInput]: modalInput }
        await chrome.storage.local.set({ actions: updatedActions })
        setActions(updatedActions)
        break
      case "label":
        const updatedLabels = { ...labels, [modalInput]: modalInput }
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

  const handleRemoveItem = async (
    type: "action" | "label" | "team",
    key: string
  ) => {
    switch (type) {
      case "action": {
        const { [key]: _, ...rest } = actions
        await chrome.storage.local.set({ actions: rest })
        setActions(rest)
        break
      }
      case "label": {
        const { [key]: _, ...rest } = labels
        await chrome.storage.local.set({ labels: rest })
        setLabels(rest)
        break
      }
      case "team": {
        const updatedTeams = teams.filter((team) => team !== key)
        await chrome.storage.local.set({ teams: updatedTeams })
        setTeams(updatedTeams)
        break
      }
    }
  }

  const handleSave = async () => {
    try {
      await chrome.storage.local.set({
        actions,
        labels,
        teams
      })
      window.close()
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  return (
    <div style={{ minWidth: "400px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>設定</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>チーム</h3>
        <button
          onClick={() => openModal("team")}
          style={{
            marginBottom: "10px",
            padding: "5px 10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          チームを追加
        </button>
        <div>
          {teams.map((team) => (
            <div
              key={team}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px",
                padding: "5px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px"
              }}>
              <span>{team}</span>
              <button
                onClick={() => handleRemoveItem("team", team)}
                style={{
                  padding: "2px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>アクション</h3>
        <button
          onClick={() => openModal("action")}
          style={{
            marginBottom: "10px",
            padding: "5px 10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          アクションを追加
        </button>
        <div>
          {Object.keys(actions).map((action) => (
            <div
              key={action}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px",
                padding: "5px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px"
              }}>
              <span>{action}</span>
              <button
                onClick={() => handleRemoveItem("action", action)}
                style={{
                  padding: "2px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>ラベル</h3>
        <button
          onClick={() => openModal("label")}
          style={{
            marginBottom: "10px",
            padding: "5px 10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          ラベルを追加
        </button>
        <div>
          {Object.keys(labels).map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px",
                padding: "5px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px"
              }}>
              <span>{label}</span>
              <button
                onClick={() => handleRemoveItem("label", label)}
                style={{
                  padding: "2px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "300px"
            }}>
            <h3>
              {modalType === "team"
                ? "チームを追加"
                : modalType === "action"
                  ? "アクションを追加"
                  : "ラベルを追加"}
            </h3>
            <input
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px"
              }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                キャンセル
              </button>
              <button
                onClick={handleModalSubmit}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                追加
              </button>
            </div>
          </div>
        </div>
      )}

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
