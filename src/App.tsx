import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import KeyRoom from './pages/KeyRoom'
import ComingSoon from './pages/ComingSoon'
import TeacherHome from './pages/teacher/TeacherHome'
import RoomManage from './pages/teacher/RoomManage'
import Join from './pages/student/Join'
import PickName from './pages/student/PickName'
import RoomHome from './pages/student/RoomHome'
import Flow from './pages/student/Flow'
import SoloHome from './pages/student/SoloHome'
import Gallery from './pages/gallery/Gallery'
import EmotionEdit from './pages/teacher/EmotionEdit'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="teacher" element={<TeacherHome />} />
        <Route path="teacher/room/:id" element={<RoomManage />} />
        <Route path="join" element={<Join />} />
        <Route path="join/:code" element={<PickName />} />
        <Route path="room/:code" element={<RoomHome />} />
        <Route path="room/:code/do/:activity" element={<Flow />} />
        <Route path="teacher/room/:id/emotions" element={<EmotionEdit />} />
        <Route path="gallery/:code" element={<Gallery />} />
        <Route path="solo" element={<SoloHome />} />
        <Route path="solo/:activity" element={<Flow />} />
        <Route path="keys" element={<KeyRoom />} />
        <Route
          path="*"
          element={<ComingSoon title="길을 잃었어요" image="/assets/words/surprise_4.png" text="이 방은 없어요. 처음으로 돌아가요." />}
        />
      </Route>
    </Routes>
  )
}
