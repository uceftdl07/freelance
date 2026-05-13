import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ForumBlogSection from "./components/ForumBlogSection";
import StatsBar from "./components/StatsBar";
import LatestOffers from "./components/LatestOffers";
import TopRecruiters from "./components/TopRecruiters";
import DealsSection from "./components/DealsSection";
import SkillsSection from "./components/SkillsSection";
import TjmStatsSection from "./components/TjmStatsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ForumBlogSection />
        <StatsBar />
        <LatestOffers />
        <TjmStatsSection />
        <TopRecruiters />
        <DealsSection />
        <SkillsSection />
      </main>
      <Footer />
    </>
  );
}
