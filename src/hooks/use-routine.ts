import { useEffect, useState } from "react";

const KEY = "cleanlabel:routine";

export function useRoutine() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {}
  }, [ids]);

  const add = (id: string) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);

  return { ids, add, remove, clear };
}
