import React from "react"

interface TeamListProps {
  teams: string[]
  onAdd: () => void
  onRemove: (team: string) => void
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onAdd,
  onRemove
}) => (
  <div style={{ marginBottom: "20px" }}>
    <h3>チーム</h3>
    <button
      onClick={onAdd}
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
            onClick={() => onRemove(team)}
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
)
