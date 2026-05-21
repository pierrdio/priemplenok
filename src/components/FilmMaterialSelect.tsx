'use client'

import { useState } from 'react'
import materialsData from '../../config/film-materials.json'

const categories = materialsData.categories
const CUSTOM_ITEM = '__custom_item__'
const CUSTOM_CAT = '__custom_cat__'

function parseValue(val: string): { catId: string; item: string; custom: string } {
  if (!val) return { catId: '', item: '', custom: '' }

  for (const cat of categories) {
    const prefix = cat.label + ' — '
    if (val.startsWith(prefix)) {
      const rest = val.slice(prefix.length)
      if (cat.items.includes(rest)) {
        return { catId: cat.id, item: rest, custom: '' }
      }
      return { catId: cat.id, item: CUSTOM_ITEM, custom: rest }
    }
  }

  return { catId: CUSTOM_CAT, item: '', custom: val }
}

interface Props {
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'default'
}

export default function FilmMaterialSelect({ value, onChange, size = 'default' }: Props) {
  const initial = parseValue(value)
  const [catId, setCatId] = useState(initial.catId)
  const [item, setItem] = useState(initial.item)
  const [customText, setCustomText] = useState(initial.custom)

  const py = size === 'sm' ? 'py-1.5' : 'py-2'
  const base = `w-full border border-slate-300 px-3 ${py} text-sm rounded focus:outline-none focus:border-slate-500`
  const selectClass = base + ' bg-white'

  const selectedCat = categories.find((c) => c.id === catId)

  function emit(newCatId: string, newItem: string, newCustom: string) {
    if (newCatId === CUSTOM_CAT) {
      onChange(newCustom)
      return
    }
    const cat = categories.find((c) => c.id === newCatId)
    if (!cat || !newItem) { onChange(''); return }
    if (newItem === CUSTOM_ITEM) {
      onChange(newCustom ? `${cat.label} — ${newCustom}` : '')
    } else {
      onChange(`${cat.label} — ${newItem}`)
    }
  }

  function handleCatChange(newCatId: string) {
    setCatId(newCatId)
    setItem('')
    setCustomText('')
    emit(newCatId, '', '')
  }

  function handleItemChange(newItem: string) {
    setItem(newItem)
    setCustomText('')
    emit(catId, newItem, '')
  }

  function handleCustomChange(text: string) {
    setCustomText(text)
    emit(catId, catId === CUSTOM_CAT ? '' : CUSTOM_ITEM, text)
  }

  return (
    <div className="space-y-2">
      <select
        value={catId}
        onChange={(e) => handleCatChange(e.target.value)}
        className={selectClass}
      >
        <option value="">— Категория плёнки</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.label}</option>
        ))}
        <option value={CUSTOM_CAT}>Другой тип</option>
      </select>

      {selectedCat && (
        <select
          value={item}
          onChange={(e) => handleItemChange(e.target.value)}
          className={selectClass}
        >
          <option value="">— Выберите плёнку</option>
          {selectedCat.items.map((it) => (
            <option key={it} value={it}>{it}</option>
          ))}
          <option value={CUSTOM_ITEM}>Другой тип</option>
        </select>
      )}

      {(catId === CUSTOM_CAT || item === CUSTOM_ITEM) && (
        <input
          type="text"
          value={customText}
          onChange={(e) => handleCustomChange(e.target.value)}
          className={base}
          placeholder="Укажите тип плёнки"
        />
      )}
    </div>
  )
}
