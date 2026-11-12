import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import KeyRoom from './pages/KeyRoom'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="teacher"
          element={<ComingSoon title="우리 반 마음방 만들기" image="/assets/words/joy_2.png" text="선생님 방은 다음 단계에서 만들어요." />}
        />
        <Route
          path="join"
          element={<ComingSoon title="마음방 들어가기" image="/assets/words/surprise_1.png" text="방 번호로 들어가는 문은 다음 단계에서 열려요." />}
        />
        <Route
          path="solo"
          element={<ComingSoon title="나의방" image="/assets/words/joy_1.png" text="혼자 만드는 방은 곧 열려요." />}
        />
        <Route path="keys" element={<KeyRoom />} />
        <Route
          path="*"
          element={<ComingSoon title="길을 잃었어요" image="/assets/words/surprise_4.png" text="이 방은 없어요. 처음으로 돌아가요." />}
        />
      </Route>
    </Routes>
  )
}
