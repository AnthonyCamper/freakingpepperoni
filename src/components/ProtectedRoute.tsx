import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isEditor, loading } = useAuth()
  if (loading) return <p className="font-label-mono text-label-mono">…</p>
  if (!session || !isEditor) return <Navigate to="/login" replace />
  return <>{children}</>
}
