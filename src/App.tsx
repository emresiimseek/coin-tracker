import { useEffect, useState } from "react";
import CoinTracker from "./CointTrackerTable";
import LoginScreen from "./Login";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState<boolean>(false);

  useEffect(() => {
    const data = sessionStorage.getItem("isLogin");
    setIsLogin(!!data);
  }, []);

  const AppComponent = () =>
    isLogin ? (
      <CoinTracker />
    ) : (
      <LoginScreen onLogin={(value) => setIsLogin(value)} />
    );

  return <AppComponent />;
}

export default App;
