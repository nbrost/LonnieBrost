import styles from './LinksPage.module.css'

const SOCIAL_LINKS = [
  {
    platform: 'Instagram',
    handle: '@yourhandle',
    href: 'https://instagram.com/yourhandle',
    accent: '#e1306c',
  },
  {
    platform: 'TikTok',
    handle: '@yourhandle',
    href: 'https://www.tiktok.com/@yourhandle',
    accent: '#00f2ea',
  },
  {
    platform: 'Facebook',
    handle: 'Your Page',
    href: 'https://facebook.com/yourpage',
    accent: '#1877f2',
  },
  {
    platform: 'YouTube',
    handle: '@yourchannel',
    href: 'https://youtube.com/@yourchannel',
    accent: '#ff0000',
  },
  {
    platform: 'X (Twitter)',
    handle: '@yourhandle',
    href: 'https://x.com/yourhandle',
    accent: '#111111',
  },
]

function PlatformBadge({ platform, accent }) {
  return (
    <span className={styles.badge} style={{ '--accent': accent }} aria-hidden="true">
      {platform.charAt(0)}
    </span>
  )
}

export default function LinksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.card}>
        <a className={styles.backLink} href="/">
          &larr; Home
        </a>

        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            LB
          </div>
          <p className={styles.displayName}>LonnieBrost</p>
          <p className={styles.tagline}>Find me everywhere</p>
        </div>

        <div className={styles.links}>
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.platform}
              className={styles.linkButton}
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              <PlatformBadge platform={item.platform} accent={item.accent} />
              <span className={styles.platform}>{item.platform}</span>
              <span className={styles.handle}>{item.handle}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
