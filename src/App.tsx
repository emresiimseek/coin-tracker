import { useEffect, useState } from "react";
import CoinTracker from "./CointTracker";
import LoginScreen from "./Login";

function App() {
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("isLogin");
    setIsLogin(!!data);
  }, []);

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
