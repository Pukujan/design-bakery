/**
 * Generic form-based array editor with field builders for each item.
 * More user-friendly than JSON editing for structured data.
 */
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface FormArrayEditorProps<T extends object> {
  /** Current items array */
  items: T[];
  /** Called when the user saves changes */
  onChange: (items: T[]) => void;
  /** A function that returns a representation label for an item */
  getLabel?: (item: T) => string;
  /** A blank template for new items */
  template: T;
  /** A function that renders the form for editing an item */
  renderForm: (item: T, onChange: (updated: T) => void) => React.ReactNode;
}

export function FormArrayEditor<T extends object>({
  items,
  onChange,
  getLabel,
  template,
  renderForm,
}: FormArrayEditorProps<T>) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function toggleExpand(i: number) {
    setExpanded(expanded === i ? null : i);
  }

  function updateItem(i: number, updated: T) {
    const next = [...items];
    next[i] = updated;
    onChange(next);
  }

  function addItem() {
    const newIndex = items.length;
    onChange([...items, { ...template }]);
    setExpanded(newIndex);
  }

  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
    setExpanded(null);
  }

  function moveItem(i: number, direction: -1 | 1) {
    const next = [...items];
    const target = i + direction;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-sm font-medium">
              {getLabel ? getLabel(item) : `Item ${i + 1}`}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveItem(i, 1)}
                disabled={i === items.length - 1}
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => toggleExpand(i)}
                title={expanded === i ? 'Collapse' : 'Expand'}
              >
                {expanded === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                onClick={() => removeItem(i)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {expanded === i && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-3 pb-3 pt-3">
              {renderForm(item, (updated) => updateItem(i, updated))}
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={addItem}>
        <Plus className="mr-2 h-4 w-4" /> Add Item
      </Button>
    </div>
  );
}
