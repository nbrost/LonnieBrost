import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import avatarImg from '../assets/lonnie_batman.png'
import styles from './LinksPage.module.css'

const SOCIAL_LINKS = [
  {
    platform: 'Instagram',
    handle: '@brostbuilds',
    href: 'https://www.instagram.com/brostbuilds/',
    kind: 'external',
    icon: FaInstagram,
    accent: '#e1306c',
  },
  {
    platform: 'TikTok',
    handle: '@brostbuilds',
    href: 'https://www.tiktok.com/@brostbuilds',
    kind: 'external',
    icon: FaTiktok,
    accent: '#00f2ea',
  },
  {
    platform: 'Facebook',
    handle: 'brostbuilds',
    href: '/links/no-account/facebook',
    kind: 'internal',
    icon: FaFacebookF,
    accent: '#1877f2',
  },
  {
    platform: 'YouTube',
    handle: 'brostbuilds',
    href: '/links/no-account/youtube',
    kind: 'internal',
    icon: FaYoutube,
    accent: '#ff0000',
  },
  {
    platform: 'X',
    handle: 'brostbuilds',
    href: '/links/no-account/x',
    kind: 'internal',
    icon: FaXTwitter,
    accent: '#111111',
  },
]

function PlatformBadge({ icon: Icon, accent }) {
  return (
    <span className={styles.badge} style={{ '--accent': accent }}>
      <Icon aria-hidden="true" />
    </span>
  )
}

function SocialCard({ item }) {
  const content = (
    <>
      <PlatformBadge icon={item.icon} accent={item.accent} />
      <span className={styles.platform}>{item.platform}</span>
      <span className={styles.handle}>{item.handle}</span>
    </>
  )

  if (item.kind === 'internal') {
    return (
      <Link key={item.platform} className={styles.linkButton} to={item.href}>
        {content}
      </Link>
    )
  }

  return (
    <a key={item.platform} className={styles.linkButton} href={item.href} target="_blank" rel="noreferrer">
      {content}
    </a>
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
          <img className={styles.avatar} src={avatarImg} alt="LonnieBrost avatar" />
          <p className={styles.displayName}>LonnieBrost</p>
          <p className={styles.tagline}>Find me everywhere</p>
        </div>

        <div className={styles.links}>
          {SOCIAL_LINKS.map((item) => (
            <SocialCard key={item.platform} item={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
