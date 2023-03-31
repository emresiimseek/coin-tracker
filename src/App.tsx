import { useEffect, useState } from "react";
import CoinTracker from "./CointTracker";
import LoginScreen from "./Login";

function App() {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <>
      {isLogin ? (
        <CoinTracker />
      ) : (
        <LoginScreen onLogin={(value) => setIsLogin(value)} />
      )}
    </>
  );
}

export default App;
