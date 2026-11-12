import { Link } from 'react-router-dom'
import styles from './Page.module.css'

interface Props {
  title: string
  text: string
  image: string
}

/** 아직 만들지 않은 방에 보여 주는 화면 */
export default function ComingSoon({ title, text, image }: Props) {
  return (
    <div className={styles.center}>
      <section className={styles.card}>
        <img className={styles.hero} src={image} alt="" />
        <h1>{title}</h1>
        <p>{text}</p>
        <Link to="/" className="btn btn-yellow">
          처음으로 가요
        </Link>
      </section>
    </div>
  )
}
