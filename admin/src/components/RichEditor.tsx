import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Type, Sigma, Trash2 } from 'lucide-react';

export type RichBlock = {
  id: string;
  type: 'text' | 'latex';
  content: string;
};

type Props = {
  value: RichBlock[];
  onChange: (blocks: RichBlock[]) => void;
  placeholder?: string;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function RichEditor({ value, onChange, placeholder }: Props) {

  function addBlock(type: 'text' | 'latex') {
    onChange([...value, { id: generateId(), type, content: '' }]);
  }

  function updateBlock(id: string, content: string) {
    onChange(value.map(b => b.id === id ? { ...b, content } : b));
  }

  function removeBlock(id: string) {
    onChange(value.filter(b => b.id !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newBlocks = [...value];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    onChange(newBlocks);
  }

  function moveDown(index: number) {
    if (index === value.length - 1) return;
    const newBlocks = [...value];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    onChange(newBlocks);
  }

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden">
      <div className="divide-y divide-gray-100">
        {value.length === 0 && (
          <div className="p-4 text-gray-400 text-sm text-center">
            {placeholder ?? 'أضف نصاً أو معادلة...'}
          </div>
        )}

        {value.map((block, index) => (
          <div key={block.id} className="p-3 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                block.type === 'latex'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {block.type === 'latex' ? 'معادلة LaTeX' : 'نص عادي'}
              </span>
              <div className="flex gap-1 mr-auto">
                <button type="button" onClick={() => moveUp(index)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs">↑</button>
                <button type="button" onClick={() => moveDown(index)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 text-xs">↓</button>
                <button type="button" onClick={() => removeBlock(block.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={block.content}
              onChange={e => updateBlock(block.id, e.target.value)}
              placeholder={block.type === 'latex' ? 'مثال: x^2 + 2x + 1 = 0' : 'اكتب النص هنا...'}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              dir={block.type === 'latex' ? 'ltr' : 'rtl'}
            />

            {block.type === 'latex' && block.content && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center overflow-x-auto">
                <p className="text-xs text-gray-400 mb-1">معاينة:</p>
                {(() => {
                  try {
                    return <BlockMath math={block.content} />;
                  } catch {
                    return <p className="text-red-500 text-xs">معادلة غير صحيحة</p>;
                  }
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          onClick={() => addBlock('text')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <Type size={14} />
          إضافة نص
        </button>
        <button
          type="button"
          onClick={() => addBlock('latex')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
        >
          <Sigma size={14} />
          إضافة معادلة
        </button>
      </div>
    </div>
  );
}

export function richBlocksToText(blocks: RichBlock[]): string {
  return blocks.map(b => b.content).join(' ');
}

export function isRichContent(value: any): value is RichBlock[] {
  return Array.isArray(value) && value.every(b => b.type && b.content !== undefined);
}