import { useEffect, useState } from 'react'
import { Blobatar } from '@blobatar/react'
import { getProfileAvatarUrl } from '../api/profile'
import type { User } from '../api/types'
import { cn } from '../lib/utils'

interface UserAvatarProps {
  user: User | null
  className?: string
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  const [photo, setPhoto] = useState<{ key: string; url: string } | null>(null)
  const version = user?.custom_avatar_version
  const userId = user?.id
  const hasCustomAvatar = user?.has_custom_avatar === true && version !== null && version !== undefined
  const photoKey = `${userId}:${version}`

  useEffect(() => {
    if (!hasCustomAvatar || version === null || version === undefined) return

    const controller = new AbortController()
    let objectUrl: string | null = null

    fetch(getProfileAvatarUrl(version), {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load profile photo')
        return response.blob()
      })
      .then(blob => {
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setPhoto({ key: photoKey, url: objectUrl })
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhoto(null)
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [hasCustomAvatar, photoKey, version])

  const label = user ? `${user.display_name || user.username}'s avatar` : 'User avatar'

  return (
    <span className={cn('block shrink-0 overflow-hidden rounded-full bg-avatar', className)}>
      {hasCustomAvatar && photo?.key === photoKey ? (
        <img
          src={photo.url}
          alt={label}
          className="size-full object-cover"
          onError={() => {
            URL.revokeObjectURL(photo.url)
            setPhoto(current => current?.url === photo.url ? null : current)
          }}
        />
      ) : user ? (
        <Blobatar name={`snippetvault-user:${user.id}`} alt={label} className="size-full object-cover" />
      ) : (
        <span aria-label={label} className="block size-full bg-avatar" />
      )}
    </span>
  )
}
