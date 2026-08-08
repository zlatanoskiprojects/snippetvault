export const TAGS = [
  { label: 'react', dotClass: 'bg-[#3d77fc]' },
  { label: 'utils', dotClass: 'bg-[#22c55e]' },
  { label: 'auth', dotClass: 'bg-[#8c5af3]' },
  { label: 'db', dotClass: 'bg-[#fba528]' },
]

export interface DemoSnippet {
  id: string
  title: string
  description: string
  lang: 'TS' | 'PY' | 'SH' | 'SQL' | 'JS'
  dotClass: string
  badgeClass: string
  favourite: boolean
  visibility: 'public' | 'private'
  tags: string[]
  code: string
}

export const SNIPPETS: DemoSnippet[] = [
  {
    id: 'use-debounce',
    title: 'useDebounce hook',
    description: 'Debounces a value by delay ms',
    lang: 'TS',
    dotClass: 'bg-[#3d77fc]',
    badgeClass: 'bg-[#0b152d] text-[#3d77fc]',
    favourite: true,
    visibility: 'public',
    tags: ['react', 'utils'],
    code: `function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}`,
  },
  {
    id: 'flatten-dict',
    title: 'Flatten nested dict',
    description: 'Recursively flattens nested dict',
    lang: 'PY',
    dotClass: 'bg-[#22c55e]',
    badgeClass: 'bg-[#062311] text-[#22c55e]',
    favourite: false,
    visibility: 'public',
    tags: ['utils'],
    code: `def flatten(d, prefix=''):
    out = {}
    for k, v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out`,
  },
  {
    id: 'docker-cleanup',
    title: 'Docker cleanup all',
    description: 'Prunes stopped containers',
    lang: 'SH',
    dotClass: 'bg-[#8c5af3]',
    badgeClass: 'bg-[#19102c] text-[#8c5af3]',
    favourite: false,
    visibility: 'private',
    tags: ['utils'],
    code: `#!/bin/sh
docker container prune -f
docker image prune -af
docker volume prune -f
docker network prune -f`,
  },
  {
    id: 'jwt-verify',
    title: 'Verify JWT middleware',
    description: 'Express middleware to check bearer token',
    lang: 'JS',
    dotClass: 'bg-[#fba528]',
    badgeClass: 'bg-[#1f1200] text-[#fba528]',
    favourite: true,
    visibility: 'private',
    tags: ['auth'],
    code: `function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.sendStatus(401)

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.sendStatus(401)
  }
}`,
  },
  {
    id: 'top-users-query',
    title: 'Top users by snippet count',
    description: 'Ranks users with a window function',
    lang: 'SQL',
    dotClass: 'bg-[#ef4444]',
    badgeClass: 'bg-[#2b0c0c] text-[#ef4444]',
    favourite: false,
    visibility: 'public',
    tags: ['db'],
    code: `SELECT user_id, COUNT(*) AS snippet_count,
       RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
FROM snippet
GROUP BY user_id
ORDER BY rank
LIMIT 10;`,
  },
  {
    id: 'use-local-storage',
    title: 'useLocalStorage hook',
    description: 'Syncs state with localStorage',
    lang: 'TS',
    dotClass: 'bg-[#3d77fc]',
    badgeClass: 'bg-[#0b152d] text-[#3d77fc]',
    favourite: false,
    visibility: 'public',
    tags: ['react'],
    code: `function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initial
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}`,
  },
  {
    id: 'hash-password',
    title: 'Hash password with scrypt',
    description: 'Node crypto scrypt hashing helper',
    lang: 'JS',
    dotClass: 'bg-[#fba528]',
    badgeClass: 'bg-[#1f1200] text-[#fba528]',
    favourite: false,
    visibility: 'private',
    tags: ['auth', 'db'],
    code: `function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return \`\${salt}:\${hash}\`
}`,
  },
]
