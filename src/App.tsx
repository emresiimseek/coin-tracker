import { useEffect, useState } from "react";
import CoinTracker from "./CointTrackerTable";
import LoginScreen from "./Login";
import "./App.css";

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
