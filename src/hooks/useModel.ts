import { useState } from 'react'
import { AI_MODELS, DEFAULT_MODEL_ID, type AIModel } from '../data/models'

const STORAGE_KEY = 'daomind-model'

export function useModel(): {
  selectedModelId: string
  model: AIModel
  setSelectedModel: (id: string) => void
} {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL_ID,
  )

  const setSelectedModel = (id: string): void => {
    localStorage.setItem(STORAGE_KEY, id)
    setSelectedModelId(id)
  }

  const model = AI_MODELS.find((m) => m.id === selectedModelId) ?? AI_MODELS[0]

  return { selectedModelId, model, setSelectedModel }
}
