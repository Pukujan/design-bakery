import { HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type FieldLabelProps = {
  htmlFor?: string;
  label: string;
  tip: string;
  hint?: string;
};

/** Label + ? tooltip for Blog Agents admin fields. */
export function FieldLabel({ htmlFor, label, tip, hint }: FieldLabelProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="font-bold">
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label={`Help: ${label}`}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[16rem] border-2 border-black bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            {tip}
          </TooltipContent>
        </Tooltip>
      </div>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}
