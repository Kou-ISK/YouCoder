import React, { useEffect, useState } from "react"

import { ActionList } from "./components/Popup/ActionList"
import { LabelList } from "./components/Popup/LabelList"
import { Modal } from "./components/Popup/Modal"
import { TeamList } from "./components/Popup/TeamList"
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
      <TeamList
        teams={teams}
        onAdd={() => openModal("team")}
        onRemove={(team) => handleRemoveItem("team", team)}
      />
      <ActionList
        actions={actions}
        onAdd={() => openModal("action")}
        onRemove={(action) => handleRemoveItem("action", action)}
      />
      <LabelList
        labels={labels}
        onAdd={() => openModal("label")}
        onRemove={(label) => handleRemoveItem("label", label)}
      />
      <Modal
        isOpen={isModalOpen}
        inputValue={modalInput}
        modalType={modalType}
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
