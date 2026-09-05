export const TAGS = [
  { label: 'react', dotClass: 'bg-category-blue' },
  { label: 'utils', dotClass: 'bg-category-green' },
  { label: 'auth', dotClass: 'bg-category-purple' },
  { label: 'db', dotClass: 'bg-category-orange' },
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
    dotClass: 'bg-language-ts',
    badgeClass: 'bg-language-ts-surface text-language-ts',
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
    dotClass: 'bg-language-py',
    badgeClass: 'bg-language-py-surface text-language-py',
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
    dotClass: 'bg-language-sh',
    badgeClass: 'bg-language-sh-surface text-language-sh',
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
    dotClass: 'bg-language-js',
    badgeClass: 'bg-language-js-surface text-language-js',
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
    dotClass: 'bg-language-sql',
    badgeClass: 'bg-language-sql-surface text-language-sql',
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
    dotClass: 'bg-language-ts',
    badgeClass: 'bg-language-ts-surface text-language-ts',
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
    dotClass: 'bg-language-js',
    badgeClass: 'bg-language-js-surface text-language-js',
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
