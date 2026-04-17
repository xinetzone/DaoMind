import React from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { FeedbackRating } from '../hooks/useFeedback'

interface Props {
  index:          number
  content:        string
  isStreaming:    boolean
  currentRating:  FeedbackRating | null
  onRate:         (index: number, content: string, rating: FeedbackRating) => void
}

/**
 * MessageFeedback — 道反按钮组
 *
 * 仅在 assistant 消息流结束后显示，提供点赞/踩两个操作。
 * 支持切换：再次点击已评分按钮 → 改变评分。
 */
export function MessageFeedback({
  index, content, isStreaming, currentRating, onRate,
}: Props): React.JSX.Element | null {
  // 流式输出中或内容为空时不显示
  if (isStreaming || !content) return null

  const handleClick = (rating: FeedbackRating): void => {
    onRate(index, content, rating)
  }

  return (
    <div className="msg-feedback">
      <button
        className={`msg-fb-btn${currentRating === 'up' ? ' active up' : ''}`}
        onClick={() => handleClick('up')}
        title="有帮助"
        aria-label="点赞"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        className={`msg-fb-btn${currentRating === 'down' ? ' active down' : ''}`}
        onClick={() => handleClick('down')}
        title="没帮助"
        aria-label="踩"
      >
        <ThumbsDown size={13} />
      </button>
      {currentRating && (
        <span className="msg-fb-thanks">
          {currentRating === 'up' ? '已标记有帮助' : '已反馈改进'}
        </span>
      )}
    </div>
  )
}
