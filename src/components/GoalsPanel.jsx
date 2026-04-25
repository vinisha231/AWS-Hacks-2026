import { useState, useRef, useEffect } from 'react'
import { useEmberStore } from '../store/emberStore'

export default function GoalsPanel() {
  const { goals, addGoal, toggleGoal, editGoal, deleteGoal } = useEmberStore()
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef(null)
  const editRef = useRef(null)

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])
  useEffect(() => { if (editingId) editRef.current?.focus() }, [editingId])

  const handleAdd = () => {
    const t = input.trim()
    if (t) { addGoal(t); setInput('') }
    setAdding(false)
  }

  const handleEditSave = (id) => {
    const t = editText.trim()
    if (t) editGoal(id, t)
    setEditingId(null)
  }

  const active = goals.filter(g => !g.done)
  const done   = goals.filter(g => g.done)

  return (
    <div className="flex flex-col h-full" style={{ background: '#e0f0e0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-green-200">
        <div>
          <h2 className="text-stone-900 font-black text-lg leading-tight">Goals</h2>
          <p className="text-stone-500 text-xs mt-0.5">{active.length} active</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null) }}
          className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors text-lg font-light leading-none"
        >
          +
        </button>
      </div>

      {/* Add input */}
      {adding && (
        <div className="px-5 pt-4 pb-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setInput('') }
            }}
            onBlur={handleAdd}
            placeholder="What's your goal?"
            className="w-full bg-white border border-green-300 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-green-500"
          />
          <p className="text-stone-400 text-xs mt-1.5 ml-0.5">Press Enter to add · Esc to cancel</p>
        </div>
      )}

      {/* Goals list */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {goals.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3 opacity-40">🎯</span>
            <p className="text-stone-600 font-semibold text-sm mb-1">No goals yet</p>
            <p className="text-stone-400 text-xs max-w-[160px]">
              Add something you're working toward. Big or small.
            </p>
          </div>
        )}

        {/* Active goals */}
        {active.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-4">
            {active.map(goal => (
              <GoalItem
                key={goal.id}
                goal={goal}
                isEditing={editingId === goal.id}
                editText={editText}
                editRef={editRef}
                onToggle={() => toggleGoal(goal.id)}
                onEdit={() => { setEditingId(goal.id); setEditText(goal.text); setAdding(false) }}
                onEditChange={setEditText}
                onEditSave={() => handleEditSave(goal.id)}
                onEditCancel={() => setEditingId(null)}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <p className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-2 mt-2">
              Completed ({done.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {done.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  isEditing={false}
                  onToggle={() => toggleGoal(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onEdit={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-green-200">
        <p className="text-stone-400 text-xs text-center">
          {active.length > 0
            ? `${done.length} of ${goals.length} complete`
            : done.length > 0
            ? 'All goals complete 🎉'
            : 'Your goals stay here across sessions'}
        </p>
      </div>
    </div>
  )
}

function GoalItem({ goal, isEditing, editText, editRef, onToggle, onEdit, onEditChange, onEditSave, onEditCancel, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="group flex items-start gap-2.5 py-2.5 px-3 rounded-xl hover:bg-green-100/60 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
          ${goal.done
            ? 'bg-green-500 border-green-500'
            : 'border-stone-300 hover:border-green-500'}`}
      >
        {goal.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Text / Edit input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editRef}
            value={editText}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onEditSave()
              if (e.key === 'Escape') onEditCancel()
            }}
            onBlur={onEditSave}
            className="w-full bg-white border border-green-400 rounded-lg px-2 py-1 text-sm text-stone-800 focus:outline-none"
          />
        ) : (
          <p
            onClick={!goal.done ? onEdit : undefined}
            className={`text-sm leading-snug break-words cursor-text
              ${goal.done ? 'line-through text-stone-400' : 'text-stone-800'}`}
          >
            {goal.text}
          </p>
        )}
      </div>

      {/* Delete button — shows on hover */}
      {(hovered || isEditing) && !isEditing && (
        <button
          onClick={onDelete}
          className="text-stone-300 hover:text-red-400 transition-colors shrink-0 text-base leading-none mt-0.5"
        >
          ×
        </button>
      )}
    </div>
  )
}
