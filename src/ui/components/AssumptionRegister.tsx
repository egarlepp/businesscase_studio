import { Plus, Trash2 } from 'lucide-react';
import { ASSUMPTION_STATUSES, blankAssumption, CONFIDENCE_LEVELS } from '../../data/assumptions';
import type { AssumptionItem } from '../../types';

interface AssumptionRegisterProps {
  items: AssumptionItem[];
  onChange: (items: AssumptionItem[]) => void;
  /** Category suggestions offered while typing. */
  categories: string[];
}

const TEXT_FIELDS: { key: 'name' | 'category' | 'owner' | 'source'; label: string }[] = [
  { key: 'name', label: 'Assumption' },
  { key: 'category', label: 'Category' },
  { key: 'owner', label: 'Owner' },
  { key: 'source', label: 'Source' },
];

/** Editable register: every material assumption with its owner, evidence, and approval state. */
export function AssumptionRegister({ items, onChange, categories }: AssumptionRegisterProps) {
  const update = (index: number, patch: Partial<AssumptionItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const listId = 'assumption-categories';

  return (
    <>
      <datalist id={listId}>
        {[...new Set(categories)].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="table-wrap">
        <table className="register">
          <caption className="sr-only">Assumption register</caption>
          <thead>
            <tr>
              {TEXT_FIELDS.map((f) => (
                <th key={f.key} scope="col">
                  {f.label}
                </th>
              ))}
              <th scope="col">Confidence</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => {
              const row = `assumption ${i + 1}`;
              return (
                <tr key={a.id}>
                  {TEXT_FIELDS.map((f) => (
                    <td key={f.key}>
                      <input
                        className="cell-input"
                        aria-label={`${f.label} for ${row}`}
                        value={a[f.key]}
                        maxLength={500}
                        list={f.key === 'category' ? listId : undefined}
                        placeholder={f.key === 'source' ? 'Where does this come from?' : undefined}
                        onChange={(e) => update(i, { [f.key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td>
                    <select
                      aria-label={`Confidence for ${row}`}
                      value={a.confidence}
                      onChange={(e) =>
                        update(i, { confidence: e.target.value as AssumptionItem['confidence'] })
                      }
                    >
                      {CONFIDENCE_LEVELS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${row}`}
                      value={a.status}
                      onChange={(e) =>
                        update(i, { status: e.target.value as AssumptionItem['status'] })
                      }
                    >
                      {ASSUMPTION_STATUSES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove ${row}${a.name ? `: ${a.name}` : ''}`}
                      title="Remove"
                      onClick={() => remove(i)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="secondary"
        onClick={() => onChange([...items, blankAssumption()])}
      >
        <Plus size={16} />
        Add assumption
      </button>
    </>
  );
}
