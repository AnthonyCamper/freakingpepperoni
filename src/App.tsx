import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import RecipePage from './pages/Recipe'
import Login from './pages/Login'

function Stub({ title }: { title: string }) {
  return <h1 className="font-display-lg text-display-lg uppercase">{title}</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="browse" element={<Browse />} />
        <Route path="recipe/:slug" element={<RecipePage />} />
        <Route path="login" element={<Login />} />
        <Route path="add" element={<Stub title="Add Recipe" />} />
        <Route path="edit/:slug" element={<Stub title="Edit Recipe" />} />
        <Route path="*" element={<Stub title="404 — Nothing Here" />} />
      </Route>
    </Routes>
  )
}
