/**
 * Generic JSON array editor.
 * Renders a list of items as editable JSON text blocks.
 * Suitable for content sections where the data is an array of objects.
 */
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

interface JsonArrayEditorProps<T extends object> {
  /** Current items array */
  items: T[];
  /** Called when the user saves changes */
  onChange: (items: T[]) => void;
  /** A function that returns a representation label for an item */
  getLabel?: (item: T) => string;
  /** A blank template for new items */
  template: T;
}

export function JsonArrayEditor<T extends object>({
  items,
  onChange,
  getLabel,
  template,
}: JsonArrayEditorProps<T>) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  function toggleExpand(i: number) {
    if (expanded === i) {
      setExpanded(null);
    } else {
      setExpanded(i);
      if (!(i in drafts)) {
        setDrafts((d) => ({ ...d, [i]: JSON.stringify(items[i], null, 2) }));
      }
    }
  }

  function updateDraft(i: number, value: string) {
    setDrafts((d) => ({ ...d, [i]: value }));
    setErrors((e) => ({ ...e, [i]: '' }));
  }

  function applyDraft(i: number) {
    try {
      const parsed = JSON.parse(drafts[i]) as T;
      const next = [...items];
      next[i] = parsed;
      onChange(next);
      setErrors((e) => ({ ...e, [i]: '' }));
    } catch {
      setErrors((e) => ({ ...e, [i]: 'Invalid JSON' }));
    }
  }

  function addItem() {
    onChange([...items, { ...template }]);
    const newIndex = items.length;
    setDrafts((d) => ({ ...d, [newIndex]: JSON.stringify(template, null, 2) }));
    setExpanded(newIndex);
  }

  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
    // reset drafts/errors for removed index
    setDrafts((d) => {
      const nd = { ...d };
      delete nd[i];
      return nd;
    });
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
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
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
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveItem(i, 1)}
                disabled={i === items.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Edit (click to expand)"
                onClick={() => toggleExpand(i)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                title="Delete"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {expanded === i && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-3 pb-3 pt-2">
              <Textarea
                className="font-mono text-xs"
                rows={10}
                value={drafts[i] ?? JSON.stringify(item, null, 2)}
                onChange={(e) => updateDraft(i, e.target.value)}
              />
              {errors[i] && (
                <p className="mt-1 text-xs text-red-500">{errors[i]}</p>
              )}
              <Button
                size="sm"
                className="mt-2"
                onClick={() => applyDraft(i)}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button variant="default" onClick={addItem} className="w-full mt-2">
        <Plus className="mr-2 h-4 w-4" /> Add Item
      </Button>
    </div>
  );
}
