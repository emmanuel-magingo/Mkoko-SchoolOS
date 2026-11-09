import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';

export interface SubtopicsListEditorProps {
  subtopics: string[];
  onChange: (subtopics: string[]) => void;
  disabled?: boolean;
}

export const SubtopicsListEditor: React.FC<SubtopicsListEditorProps> = ({
  subtopics,
  onChange,
  disabled = false,
}) => {
  const handleAddSubtopic = () => {
    onChange([...subtopics, '']);
  };

  const handleRemoveSubtopic = (index: number) => {
    const updated = subtopics.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ['']);
  };

  const handleChangeSubtopic = (index: number, value: string) => {
    const updated = [...subtopics];
    updated[index] = value;
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...subtopics];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === subtopics.length - 1) return;
    const updated = [...subtopics];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <ListOrdered className="w-4 h-4 text-blue-600" />
          <span>Subtopics List (Ordered)</span>
        </label>
        <span className="text-xs text-slate-500">
          {subtopics.filter((s) => s.trim().length > 0).length} subtopic(s) defined
        </span>
      </div>

      <div className="space-y-2.5" data-testid="subtopics-inputs-container">
        {subtopics.map((subtopic, index) => (
          <div
            key={index}
            className="flex items-center gap-2 group transition-all"
            data-testid={`subtopic-row-${index}`}
          >
            {/* Number indicator */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 border border-blue-200">
              {index + 1}
            </span>

            {/* Independent input field */}
            <input
              type="text"
              id={`subtopic-input-${index}`}
              data-testid={`subtopic-input-${index}`}
              value={subtopic}
              onChange={(e) => handleChangeSubtopic(index, e.target.value)}
              placeholder={`Enter subtopic ${index + 1} (e.g. Identifying the main idea)`}
              disabled={disabled}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Reorder Up */}
            <button
              type="button"
              data-testid={`move-up-subtopic-${index}`}
              title="Move Up"
              disabled={disabled || index === 0}
              onClick={() => handleMoveUp(index)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Reorder Down */}
            <button
              type="button"
              data-testid={`move-down-subtopic-${index}`}
              title="Move Down"
              disabled={disabled || index === subtopics.length - 1}
              onClick={() => handleMoveDown(index)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            {/* Remove */}
            <button
              type="button"
              data-testid={`remove-subtopic-${index}`}
              title="Remove Subtopic"
              disabled={disabled || subtopics.length <= 1}
              onClick={() => handleRemoveSubtopic(index)}
              className="p-1.5 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-testid="add-subtopic-btn"
        disabled={disabled}
        onClick={handleAddSubtopic}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 hover:border-blue-400 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Subtopic</span>
      </button>
    </div>
  );
};
