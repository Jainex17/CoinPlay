import { Home } from "./components/home/Home";
import { Navbar } from "./components/Navbar";
import Layout from "./Layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CoinFlip } from "./components/CoinFlip";
import { TermsOfService } from "./components/TermsOfService";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { Portfolio } from "./components/Portfolio";

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
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
