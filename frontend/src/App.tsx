import { Home } from "./components/home/Home"
import { Navbar } from "./components/Navbar"
import Layout from "./Layout"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CoinFlip } from "./components/CoinFlip"

function App() {

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
  )
}

export default App
