import React from "react"

import { logger } from "../../utils/errorHandling"
import { DraggableResizable } from "../DraggableResizable"
import { useTimelinePanel } from "./hooks/useTimelinePanel"
import { useTimelinePanelPosition } from "./hooks/useTimelinePanelPosition"
import { TimelinePanelContent } from "./TimelinePanelContent"
import type { TimelinePanelProps } from "./types"

const MIN_WIDTH = 300
const MIN_HEIGHT = 180

/**
 * タイムラインパネルコンポーネント
 * DraggableResizableコンポーネントでラップし、アクションの表示と管理を行う
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave,
  onExportCSV,
  onSeek,
  defaultSort,
  defaultFilter
}) => {
  logger.debug(
    `[TimelinePanel] レンダリング開始 - 受信アクション数: ${actions.length}`
  )

  // パネルの位置とサイズの管理
  const { position, size, handlePositionChange, handleSizeChange } =
    useTimelinePanelPosition({
      storageKey: "timelinePanel"
    })

  // タイムラインのビジネスロジック
  const timelinePanelState = useTimelinePanel({
    actions,
    defaultSort,
    defaultFilter
  })

  return (
    <DraggableResizable
      initialPosition={position}
      initialSize={size}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      className="rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 transition-all duration-300 ease-in-out hover:shadow-2xl"
      style={{
        zIndex: 10000,
        borderRadius: "8px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column"
      }}>
      <TimelinePanelContent
        actions={actions}
        onDelete={onDelete}
        onSeek={onSeek}
        onExportCSV={onExportCSV}
        onSave={onSave}
        {...timelinePanelState}
      />
    </DraggableResizable>
  )
}
