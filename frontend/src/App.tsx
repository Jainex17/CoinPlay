import { Home } from "./components/home/Home";
import { Navbar } from "./components/Navbar";
import Layout from "./Layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CoinFlip } from "./components/CoinFlip";
import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  console.log(user);

  return (
    <>
      <BrowserRouter>
        <Layout>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coinflip" element={<CoinFlip />} />
            <Route path="/slots" element={<h1>Slots</h1>} />
            <Route path="/portfolio" element={<h1>Portfolio</h1>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
