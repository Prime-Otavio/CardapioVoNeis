import { AuthContext } from './AuthProvider'

export const AuthContextForTest = ({ value, children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
)
