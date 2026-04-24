---
name: react-patterns
description: React 19 patterns — hooks, state management, data fetching, error boundaries, performance. Use when building React components.
---

# React 19 Patterns

## Data Fetching with use()
```tsx
import { use, Suspense } from "react";

function Items({ promise }: { promise: Promise<Item[]> }) {
  const items = use(promise);
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// Usage
<Suspense fallback={<Spinner />}>
  <Items promise={fetchItems()} />
</Suspense>
```

## Custom Hook for API Calls
```tsx
function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
```

## Form Pattern
```tsx
function CreateForm({ onSubmit }: { onSubmit: (data: FormData) => Promise<void> }) {
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await onSubmit(fd);
    setPending(false);
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Error Boundary
```tsx
import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

## Optimistic Updates
```tsx
const [items, setItems] = useState<Item[]>([]);

const deleteItem = async (id: number) => {
  const prev = items;
  setItems(items.filter(i => i.id !== id)); // optimistic
  try {
    await api.delete(id);
  } catch {
    setItems(prev); // rollback
  }
};
```

## Accessible Modal Pattern
```tsx
function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}
```

## Performance: Memo & Callback
```tsx
// Memoize expensive renders
const MemoCard = memo(function Card({ item }: { item: Item }) {
  return <div>{item.title}</div>;
});

// Stable callbacks for child components
const handleDelete = useCallback((id: number) => {
  setItems(prev => prev.filter(i => i.id !== id));
}, []);
```
