import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

function Stub({ title }: { title: string }) {
  return <h1 className="font-display-lg text-display-lg uppercase">{title}</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Stub title="Home" />} />
        <Route path="browse" element={<Stub title="Browse" />} />
        <Route path="recipe/:slug" element={<Stub title="Recipe" />} />
        <Route path="login" element={<Stub title="Login" />} />
        <Route path="add" element={<Stub title="Add Recipe" />} />
        <Route path="edit/:slug" element={<Stub title="Edit Recipe" />} />
        <Route path="*" element={<Stub title="404 — Nothing Here" />} />
      </Route>
    </Routes>
  )
}
