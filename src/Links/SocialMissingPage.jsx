import { Link, useParams } from 'react-router-dom'
import { FaFacebookF, FaYoutube } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import styles from './SocialMissingPage.module.css'

const SOCIAL_META = {
  facebook: {
    label: 'Facebook',
    color: '#1877f2',
    Icon: FaFacebookF,
  },
  youtube: {
    label: 'YouTube',
    color: '#ff0000',
    Icon: FaYoutube,
  },
  x: {
    label: 'X',
    color: '#111111',
    Icon: FaXTwitter,
  },
}

export default function SocialMissingPage() {
  const { platform = '' } = useParams()
  const key = platform.toLowerCase()
  const social = SOCIAL_META[key] ?? {
    label: 'Social media',
    color: '#213a30',
    Icon: FaXTwitter,
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logoWrap} style={{ '--brand': social.color }} aria-hidden="true">
          <social.Icon />
        </span>

        <p className={styles.headline}>haha idiot I don't have a {social.label} account</p>

        <p className={styles.subtext}>You can still stalk the rest of my links if you want.</p>

        <div className={styles.actions}>
          <Link className={styles.button} to="/links">
            Back to links
          </Link>
          <Link className={styles.ghostButton} to="/">
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
