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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInput, setModalInput] = useState("")
  const [modalType, setModalType] = useState<"action" | "label" | null>(null)

  useEffect(() => {
    const storedActions = localStorage.getItem("actions")
    const storedLabels = localStorage.getItem("labels")
    if (storedActions) {
      setActions(JSON.parse(storedActions))
    }
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels))
    }
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

  const openModal = (type: "action" | "label") => {
    setModalType(type)
    setModalInput("")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalType(null)
  }

  const handleModalSubmit = () => {
    console.log("handleModalSubmit")
    if (modalType === "action" && modalInput) {
      setActions((prev) => {
        console.log("prev", prev)
        console.log("modalInput", modalInput)
        const updated = { ...prev, [modalInput]: "" }
        localStorage.setItem("actions", JSON.stringify(updated))
        return updated
      })
    } else if (modalType === "label" && modalInput) {
      setLabels((prev) => {
        console.log("prev", prev)
        console.log("modalInput", modalInput)
        const updated = { ...prev, [modalInput]: "" }
        localStorage.setItem("labels", JSON.stringify(updated))
        return updated
      })
    }
    closeModal()
  }

  const handleSave = () => {
    saveHotkeysToStorage(hotkeys)
    localStorage.setItem("actions", JSON.stringify(actions))
    localStorage.setItem("labels", JSON.stringify(labels))
    alert("Settings saved!")
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
      <h1>YouCoder Settings</h1>
      <h2>Google Sheets Integration</h2>
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
      <h2>Action Hotkeys</h2>
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
      <h2>Label Hotkeys</h2>
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
      <button onClick={handleSave} style={{ marginTop: "1rem" }}>
        Save Hotkeys
      </button>
      <h2>Actions</h2>
      <ul>
        {Object.keys(actions).map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      <button onClick={() => openModal("action")}>Add Action</button>

      <h2>Labels</h2>
      <ul>
        {Object.keys(labels).map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
      <button onClick={() => openModal("label")}>Add Label</button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add {modalType === "action" ? "Action" : "Label"}</h2>
            <input
              type="text"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
            />
            <button onClick={handleModalSubmit}>Submit</button>
            <button onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Popup
