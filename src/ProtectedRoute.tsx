// // src/components/ProtectedRoute.tsx
// import React from 'react';
// import { Navigate } from 'react-router-dom';

// interface ProtectedRouteProps {
//   children: JSX.Element;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//   const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

//   return isLoggedIn ? children : <Navigate to="/" replace />;
// };

// export default ProtectedRoute;
