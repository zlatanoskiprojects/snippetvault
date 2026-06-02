export const snippets = [
  {
    id: 1,
    title: 'useDebounce hook',
    description: 'Debounces a value by delay ms — useful for search inputs.',
    language: 'TS',
    tags: ['#react', '#hooks', '#utils'],
    timestamp: '2d ago',
    code: `import { useState, useEffect } from "react";

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}`,
  },
  {
    id: 2,
    title: 'Flatten nested dict',
    description: 'Recursively flattens a nested dict with dot-separated keys.',
    language: 'PY',
    tags: ['#python', '#utils'],
    timestamp: '5d ago',
    code: `def flatten(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep).items())
        else:
            items.append((new_key, v))
    return dict(items)`,
  },
  {
    id: 3,
    title: 'Docker cleanup all',
    description: 'Prunes all stopped containers, images, and volumes.',
    language: 'SH',
    tags: ['#docker', '#devops'],
    timestamp: '1w ago',
    code: `#!/bin/bash
docker container prune -f
docker image prune -a -f
docker volume prune -f
echo "Docker cleanup complete."`,
  },
  {
    id: 4,
    title: 'Paginate with offset',
    description: 'Cursor-style pagination using LIMIT/OFFSET params.',
    language: 'SQL',
    tags: ['#db', '#postgres'],
    timestamp: '3d ago',
    code: `SELECT *
FROM snippets
ORDER BY created_at DESC
LIMIT :limit
OFFSET :offset;`,
  },
  {
    id: 5,
    title: 'JWT verify middleware',
    description: 'Hono middleware that validates Bearer JWT on each request.',
    language: 'TS',
    tags: ['#auth', '#hono'],
    timestamp: '1d ago',
    code: `import { verify } from "hono/jwt";

export const authMiddleware = async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = await verify(token, process.env.JWT_SECRET);
    c.set("userId", payload.sub);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};`,
  },
]