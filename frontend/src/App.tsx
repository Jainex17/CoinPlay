import { Home } from "./components/home/Home"
import { Navbar } from "./components/Navbar"
import Layout from "./Layout"
import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {

  return (
    <>
      <BrowserRouter>
    <Layout>
      <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coinflip" element={<h1>CoinFlip</h1>} />
          <Route path="/slots" element={<h1>Slots</h1>} />
          <Route path="/portfolio" element={<h1>Portfolio</h1>} />
        </Routes>
    </Layout>
      </BrowserRouter>
    </>
  )
}

export default App
